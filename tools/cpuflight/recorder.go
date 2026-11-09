package main

import (
	"bufio"
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"golang.org/x/sys/unix"
)

const (
	retainDays      = 3
	maxDBBytes      = 400 * 1024 * 1024
	kbPerMB         = 1024
	othersEvery     = 5 // ticks between `ps` reads of other users' processes
	flushEvery      = 15
	heartbeatEvery  = 150
	cwdLookups      = 5
	pruneEvery      = 1800
	logPollEvery    = 5 * time.Minute
	logSettle       = 30 * time.Second // the log can deliver entries slightly late
	logBackfillMax  = 6 * time.Hour
	logRatePerMin   = 120
	logCursorKey    = "log_cursor"
	logTimeArgument = "2006-01-02 15:04:05"
	// Only messages macOS keeps on disk can be queried later. The kernel's own
	// memorystatus lines exist solely on the live feed, which is what made
	// recording so costly; these stored messages cover the same real events.
	logPredicate = `(process == "launchd" AND eventMessage CONTAINS "exited due to SIG")` +
		` OR (process == "symptomsd" AND eventMessage CONTAINS "thermal-pressure")` +
		` OR (process == "ReportSystemMemory" AND eventMessage CONTAINS "killed by jetsam")`
)

const schema = `
CREATE TABLE IF NOT EXISTS processes (
  id INTEGER PRIMARY KEY, pid INTEGER, started INTEGER, first_seen INTEGER, last_seen INTEGER,
  exited INTEGER, ppid INTEGER, name TEXT, label TEXT, owner TEXT, command TEXT, cwd TEXT,
  cpu_seconds REAL DEFAULT 0, cpu_clock REAL DEFAULT 0, peak_rss_kb INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS processes_exited ON processes(exited);
CREATE TABLE IF NOT EXISTS samples (
  ts INTEGER, proc INTEGER, cpu_ms INTEGER, rss_kb INTEGER, PRIMARY KEY (ts, proc)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS system (
  ts INTEGER PRIMARY KEY, cpu_ms INTEGER, interval_ms INTEGER, load1 REAL,
  swap_used_mb INTEGER, disk_free_gb REAL, processes INTEGER);
CREATE TABLE IF NOT EXISTS events (ts INTEGER, kind TEXT, message TEXT);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`

func databaseURL(path string, options string) string {
	return (&url.URL{Scheme: "file", Path: path, RawQuery: options}).String()
}

func openRecording(path string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite3", databaseURL(path, "_auto_vacuum=incremental&_journal_mode=WAL&_synchronous=NORMAL&_busy_timeout=30000"))
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	return db, os.Chmod(path, 0o600)
}

// record is what the recorder knows about one running process.
type record struct {
	id, started, peak      int64
	pid, ppid, pgid        int32
	name, label, owner     string
	command, session, cwd  string
	scratch                string
	cpu, total, savedTotal float64
	cpuKnown, viaPS, dirty bool
	inserted               bool
	seenTick               int
}

// logBatch carries one log query's events and how far it read. The two are
// committed together so a restart neither repeats nor loses entries.
type logBatch struct {
	events []event
	cursor time.Time
}

type statements struct {
	insertProcess, updateProcess, finishProcess, insertSample, insertSystem, insertEvent, setCwd *sql.Stmt
}

type Recorder struct {
	db          *sql.DB
	sys         *native
	statements  statements
	interval    time.Duration
	live        map[int32]*record
	groupOwner  map[int32]string
	tick        int
	lastBusy    uint64
	swap        sql.NullInt64
	disk        sql.NullFloat64
	reportsSeen map[string]bool
	pending     []event
	logs        chan logBatch
}

func NewRecorder(path string, interval time.Duration) (*Recorder, error) {
	db, err := openRecording(path)
	if err != nil {
		return nil, err
	}
	sys, err := newNative()
	if err != nil {
		db.Close()
		return nil, err
	}
	r := &Recorder{
		db: db, sys: sys, interval: interval,
		live: make(map[int32]*record, 1024), groupOwner: map[int32]string{}, logs: make(chan logBatch, 8),
	}
	if err = r.prepare(); err != nil {
		db.Close()
		return nil, err
	}
	if err = r.resume(); err != nil {
		db.Close()
		return nil, err
	}
	return r, nil
}

func (r *Recorder) prepare() error {
	targets := []struct {
		slot **sql.Stmt
		text string
	}{
		{&r.statements.insertProcess, "INSERT INTO processes (pid, started, first_seen, last_seen, ppid, name, label, owner, command, peak_rss_kb) VALUES (?,?,?,?,?,?,?,?,?,?)"},
		{&r.statements.updateProcess, "UPDATE processes SET last_seen=?, cpu_seconds=?, cpu_clock=?, peak_rss_kb=? WHERE id=?"},
		{&r.statements.finishProcess, "UPDATE processes SET exited=?, last_seen=?, cpu_seconds=?, cpu_clock=?, peak_rss_kb=? WHERE id=?"},
		{&r.statements.insertSample, "INSERT OR REPLACE INTO samples VALUES (?,?,?,?)"},
		{&r.statements.insertSystem, "INSERT OR REPLACE INTO system VALUES (?,?,?,?,?,?,?)"},
		{&r.statements.insertEvent, "INSERT INTO events VALUES (?,?,?)"},
		{&r.statements.setCwd, "UPDATE processes SET cwd=? WHERE id=?"},
	}
	for _, target := range targets {
		statement, err := r.db.Prepare(target.text)
		if err != nil {
			return fmt.Errorf("prepare %q: %w", target.text, err)
		}
		*target.slot = statement
	}
	return nil
}

// resume picks up processes still open from an earlier run, so that a restart
// does not count their whole lifetime again.
func (r *Recorder) resume() error {
	now := time.Now().Unix()
	if _, err := r.db.Exec("UPDATE processes SET exited = last_seen WHERE exited IS NULL AND last_seen < ?", now-600); err != nil {
		return err
	}
	rows, err := r.db.Query("SELECT id, pid, started, cpu_clock, cpu_seconds, peak_rss_kb, owner, label, name, command, ppid, cwd FROM processes WHERE exited IS NULL")
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var cwd sql.NullString
		rec := &record{cpuKnown: true, inserted: true}
		if err = rows.Scan(&rec.id, &rec.pid, &rec.started, &rec.cpu, &rec.total, &rec.peak, &rec.owner, &rec.label, &rec.name, &rec.command, &rec.ppid, &cwd); err != nil {
			return err
		}
		rec.cwd = cwd.String
		rec.savedTotal = rec.total
		r.live[rec.pid] = rec
	}
	r.pending = append(r.pending, event{now, "recorder", "recording started"})
	return rows.Err()
}

// identify builds a record for a process seen for the first time. Arguments
// are only available for the user's own processes; others keep their path.
func (r *Recorder) identify(process *unix.KinfoProc) *record {
	pid := process.Proc.P_pid
	_, argv, ok := r.sys.arguments(pid)
	program := r.sys.program(pid)
	shortName := unix.ByteSliceToString(process.Proc.P_comm[:])
	name := processName(argv, program, shortName)
	raw := strings.Join(argv, " ")
	if !ok || raw == "" {
		raw = program
		if raw == "" {
			raw = shortName
		}
	}
	rec := &record{
		pid: pid, started: process.Proc.P_starttime.Sec, name: name,
		label: labelFor(name, raw), command: cleanCommand(raw), dirty: true,
	}
	if match := sessionRE.FindStringSubmatch(raw); match != nil {
		rec.session = match[1]
	}
	if match := scratchRE.FindStringSubmatch(raw); match != nil {
		rec.scratch = match[1]
	}
	return rec
}

func isAgent(owner string) bool {
	return strings.HasPrefix(owner, "claude:") || strings.HasPrefix(owner, "codex:")
}

// ownerFor walks up the parent chain to find the agent or app responsible.
func (r *Recorder) ownerFor(rec *record) string {
	current := rec.pid
	top := rec
	seen := make(map[int32]bool, 8)
	for current > 1 && !seen[current] {
		parent := r.live[current]
		if parent == nil {
			break
		}
		seen[current] = true
		top = parent
		if parent.name == "claude" && parent.session != "" {
			return "claude:" + parent.session
		}
		if strings.HasPrefix(parent.name, "codex") {
			return fmt.Sprintf("codex:%d", current)
		}
		if current != rec.pid && isAgent(parent.owner) {
			return parent.owner
		}
		current = parent.ppid
	}
	if rec.scratch != "" {
		return "claude:" + rec.scratch
	}
	if owner, ok := r.groupOwner[rec.pgid]; ok {
		return owner
	}
	for _, prefix := range []string{"/System/", "/usr/libexec/", "/usr/sbin/", "/sbin/"} {
		if strings.HasPrefix(top.command, prefix) {
			return "macOS"
		}
	}
	if app := appOwner(top.command); app != "" {
		return "app:" + app
	}
	return "proc:" + labelFor(top.name, top.command)
}

func (r *Recorder) finish(tx *sql.Tx, rec *record, now int64) error {
	_, err := tx.Stmt(r.statements.finishProcess).Exec(now, now, rec.total, rec.cpu, rec.peak, rec.id)
	return err
}

// observe folds one reading into a record and writes what is worth keeping.
func (r *Recorder) observe(tx *sql.Tx, rec *record, cpu float64, rss, now int64, window time.Duration, flush bool) error {
	delta := 0.0
	if rec.cpuKnown {
		delta = max(0, cpu-rec.cpu)
	} else if now-rec.started <= int64(window/time.Second) {
		delta = cpu // it started since the last reading, so all of its CPU is new
	}
	rec.cpuKnown = true
	rec.cpu = cpu
	rec.total += delta
	if rss > rec.peak {
		rec.peak = rss
		rec.dirty = true
	}
	cpuMS := int64(delta * 1000)
	if cpuMS >= 20 || (flush && rss >= 200*kbPerMB) {
		if _, err := tx.Stmt(r.statements.insertSample).Exec(now, rec.id, cpuMS, rss); err != nil {
			return err
		}
		rec.dirty = true
	}
	return nil
}

func (r *Recorder) readOthers(tx *sql.Tx, now int64, flush bool) error {
	command := exec.Command("/bin/ps", "-A", "-o", "pid=,rss=,time=")
	command.Env = []string{"LC_ALL=C"}
	output, err := command.Output()
	if err != nil {
		return fmt.Errorf("ps: %w", err)
	}
	for pid, usage := range parsePS(output) {
		rec := r.live[pid]
		if rec == nil || !rec.viaPS {
			continue
		}
		if err = r.observe(tx, rec, usage.cpu, usage.rss, now, 2*othersEvery*r.interval, flush); err != nil {
			return err
		}
	}
	return nil
}

func (r *Recorder) sample(tx *sql.Tx, elapsed time.Duration) ([]*record, error) {
	now := time.Now().Unix()
	processes, err := r.sys.list()
	if err != nil {
		return nil, err
	}
	var fresh []*record
	running := make([]*record, 0, len(processes))
	for i := range processes {
		process := &processes[i]
		pid := process.Proc.P_pid
		if pid <= 0 || process.Proc.P_stat == zombieState {
			continue
		}
		rec := r.live[pid]
		// Allow for the rounding of start times recorded by earlier versions.
		if rec != nil && (rec.started-process.Proc.P_starttime.Sec > 3 || process.Proc.P_starttime.Sec-rec.started > 3) {
			if err = r.finish(tx, rec, now); err != nil {
				return fresh, err
			}
			rec = nil
		}
		if rec == nil {
			rec = r.identify(process)
			r.live[pid] = rec
			fresh = append(fresh, rec)
		}
		rec.ppid, rec.pgid = process.Eproc.Ppid, process.Eproc.Pgid
		rec.seenTick = r.tick
		if process.Eproc.Ucred.Uid != r.sys.ownUID {
			rec.viaPS = true
		}
		running = append(running, rec)
	}
	for pid, rec := range r.live {
		if rec.seenTick != r.tick {
			if err = r.finish(tx, rec, now); err != nil {
				return fresh, err
			}
			delete(r.live, pid)
		}
	}
	for _, rec := range fresh {
		rec.owner = r.ownerFor(rec)
		if isAgent(rec.owner) {
			r.groupOwner[rec.pgid] = rec.owner
		}
		result, insertErr := tx.Stmt(r.statements.insertProcess).Exec(rec.pid, rec.started, now, now, rec.ppid, rec.name, rec.label, rec.owner, rec.command, rec.peak)
		if insertErr != nil {
			return fresh, insertErr
		}
		if rec.id, err = result.LastInsertId(); err != nil {
			return fresh, err
		}
		rec.inserted = true
	}

	flush := r.tick%flushEvery == 0
	lookups := 0
	for _, rec := range running {
		if !rec.viaPS {
			cpu, rss, ok := r.sys.usage(rec.pid)
			if ok {
				if err = r.observe(tx, rec, cpu, rss, now, 2*r.interval, flush); err != nil {
					return fresh, err
				}
			} else {
				rec.viaPS = true // some of the user's processes are protected
			}
		}
		if rec.cwd == "" && rec.total >= 3 && lookups < cwdLookups {
			lookups++
			rec.cwd = r.sys.workingDirectory(rec.pid)
			if rec.cwd == "" {
				rec.cwd = "?"
			}
			if _, err = tx.Stmt(r.statements.setCwd).Exec(rec.cwd, rec.id); err != nil {
				return fresh, err
			}
		}
	}
	if r.tick%othersEvery == 0 {
		if err = r.readOthers(tx, now, flush); err != nil {
			return fresh, err
		}
	}
	heartbeat := r.tick%heartbeatEvery == 0
	for _, rec := range running {
		if rec.dirty || heartbeat || (flush && rec.total != rec.savedTotal) {
			if _, err = tx.Stmt(r.statements.updateProcess).Exec(now, rec.total, rec.cpu, rec.peak, rec.id); err != nil {
				return fresh, err
			}
			rec.dirty = false
			rec.savedTotal = rec.total
		}
	}
	return fresh, r.writeSystem(tx, now, elapsed, len(running))
}

func (r *Recorder) writeSystem(tx *sql.Tx, now int64, elapsed time.Duration, count int) error {
	busy, ok := r.sys.busyMS()
	var cpuMS int64
	if ok && r.lastBusy != 0 && busy >= r.lastBusy {
		cpuMS = int64(busy - r.lastBusy)
	}
	if ok {
		r.lastBusy = busy
	}
	if r.tick%othersEvery == 0 {
		if used, known := swapUsedMB(); known {
			r.swap = sql.NullInt64{Int64: used, Valid: true}
		}
		var stat unix.Statfs_t
		if unix.Statfs(homeDir, &stat) == nil {
			r.disk = sql.NullFloat64{Float64: float64(stat.Bavail) * float64(stat.Bsize) / 1e9, Valid: true}
		}
	}
	_, err := tx.Stmt(r.statements.insertSystem).Exec(now, cpuMS, elapsed.Milliseconds(), loadAverage(), r.swap, r.disk, count)
	return err
}

func (r *Recorder) scanReports() {
	names := map[string]bool{}
	var added []string
	// Real memory-pressure kills write a JetsamEvent report to the system folder.
	for _, folder := range []string{filepath.Join(homeDir, "Library/Logs/DiagnosticReports"), "/Library/Logs/DiagnosticReports"} {
		entries, err := os.ReadDir(folder)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			names[entry.Name()] = true
			if r.reportsSeen != nil && !r.reportsSeen[entry.Name()] {
				added = append(added, entry.Name())
			}
		}
	}
	sort.Strings(added)
	now := time.Now().Unix()
	for _, name := range added {
		r.pending = append(r.pending, event{now, "crash-report", name})
	}
	r.reportsSeen = names
}

// queryLog reads the stored system log for a closed time window. It costs a
// fraction of a second every few minutes, against a live feed that kept the log
// daemon busy all the time, and it also recovers what happened while recording
// was down. Entries are capped per minute so a flood cannot fill the database.
func queryLog(ctx context.Context, start, end time.Time) ([]event, error) {
	command := exec.CommandContext(ctx, "/usr/bin/log", "show", "--style", "ndjson",
		"--start", start.Format(logTimeArgument), "--end", end.Format(logTimeArgument), "--predicate", logPredicate)
	output, err := command.Output()
	if err != nil {
		return nil, err
	}
	var events []event
	perMinute := map[int64]int{}
	scanner := bufio.NewScanner(bytes.NewReader(output))
	scanner.Buffer(make([]byte, 0, 64*1024), 16*1024*1024)
	for scanner.Scan() {
		moment, message, ok := parseLogEntry(scanner.Bytes())
		if !ok || moment.Before(start) || !moment.Before(end) {
			continue
		}
		minute := moment.Unix() / 60
		perMinute[minute]++
		if perMinute[minute] <= logRatePerMin {
			events = append(events, event{moment.Unix(), "system-log", message})
		}
	}
	return events, scanner.Err()
}

func (r *Recorder) logCursor() time.Time {
	now := time.Now()
	var value string
	if r.db.QueryRow("SELECT value FROM meta WHERE key = ?", logCursorKey).Scan(&value) != nil {
		return now.Add(-logSettle)
	}
	moment, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return now.Add(-logSettle)
	}
	if oldest := now.Add(-logBackfillMax); moment.Before(oldest) {
		r.pending = append(r.pending, event{now.Unix(), "recorder", "system log before " + oldest.Format("15:04") + " on this run's first read was skipped"})
		return oldest
	}
	return moment
}

func (r *Recorder) pollLogs(ctx context.Context, cursor time.Time) {
	for {
		end := time.Now().Add(-logSettle).Truncate(time.Second)
		if end.After(cursor) {
			events, err := queryLog(ctx, cursor, end)
			switch {
			case ctx.Err() != nil:
				return
			case err != nil:
				failure := event{time.Now().Unix(), "recorder", "log query failed: " + err.Error()}
				select {
				case r.logs <- logBatch{events: []event{failure}, cursor: cursor}:
				case <-ctx.Done():
					return
				}
			default:
				select {
				case r.logs <- logBatch{events: events, cursor: end}:
					cursor = end
				case <-ctx.Done():
					return
				}
			}
		}
		select {
		case <-time.After(logPollEvery):
		case <-ctx.Done():
			return
		}
	}
}

func (r *Recorder) writeEvents(tx *sql.Tx) error {
	for {
		select {
		case batch := <-r.logs:
			r.pending = append(r.pending, batch.events...)
			if _, err := tx.Exec("INSERT OR REPLACE INTO meta VALUES (?, ?)", logCursorKey, batch.cursor.Format(time.RFC3339)); err != nil {
				return err
			}
		default:
			for _, item := range r.pending {
				if _, err := tx.Stmt(r.statements.insertEvent).Exec(item.ts, item.kind, item.message); err != nil {
					return err
				}
			}
			r.pending = r.pending[:0]
			return nil
		}
	}
}

func (r *Recorder) prune() error {
	cutoff := time.Now().Unix() - retainDays*86400
	for _, statement := range []string{
		"DELETE FROM samples WHERE ts < ?", "DELETE FROM system WHERE ts < ?", "DELETE FROM events WHERE ts < ?",
		"DELETE FROM processes WHERE exited IS NOT NULL AND last_seen < ?",
	} {
		if _, err := r.db.Exec(statement, cutoff); err != nil {
			return err
		}
	}
	var pages, pageSize int64
	if err := r.db.QueryRow("PRAGMA page_count").Scan(&pages); err != nil {
		return err
	}
	if err := r.db.QueryRow("PRAGMA page_size").Scan(&pageSize); err != nil {
		return err
	}
	if pages*pageSize > maxDBBytes {
		var oldest, newest sql.NullInt64
		if err := r.db.QueryRow("SELECT min(ts), max(ts) FROM system").Scan(&oldest, &newest); err != nil {
			return err
		}
		if oldest.Valid && newest.Valid {
			if _, err := r.db.Exec("DELETE FROM samples WHERE ts < ?", oldest.Int64+(newest.Int64-oldest.Int64)/4); err != nil {
				return err
			}
			r.pending = append(r.pending, event{time.Now().Unix(), "recorder", "pruned oldest quarter: database over size limit"})
		}
	}
	active := make(map[int32]bool, len(r.live))
	for _, rec := range r.live {
		active[rec.pgid] = true
	}
	for group := range r.groupOwner {
		if !active[group] {
			delete(r.groupOwner, group)
		}
	}
	// These run one step per row, so the rows must be read to do all the work.
	for _, pragma := range []string{"PRAGMA incremental_vacuum(4000)", "PRAGMA wal_checkpoint(TRUNCATE)"} {
		rows, err := r.db.Query(pragma)
		if err != nil {
			return err
		}
		for rows.Next() {
		}
		rows.Close()
		if err = rows.Err(); err != nil {
			return err
		}
	}
	return nil
}

func (r *Recorder) step(elapsed time.Duration) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	fresh, err := r.sample(tx, elapsed)
	if err == nil {
		if r.tick%flushEvery == 0 {
			r.scanReports()
		}
		err = r.writeEvents(tx)
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		tx.Rollback()
		for _, rec := range fresh { // their rows were undone, so see them as new next time
			if r.live[rec.pid] == rec {
				delete(r.live, rec.pid)
			}
		}
		return err
	}
	if r.tick%pruneEvery == 1 {
		return r.prune()
	}
	return nil
}

func (r *Recorder) saveProgress() error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	now := time.Now().Unix()
	for _, rec := range r.live {
		if !rec.inserted {
			continue
		}
		if _, err = tx.Stmt(r.statements.updateProcess).Exec(now, rec.total, rec.cpu, rec.peak, rec.id); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (r *Recorder) Run(ctx context.Context, duration time.Duration) error {
	defer r.db.Close()
	logCtx, stopLogs := context.WithCancel(ctx)
	defer stopLogs()
	go r.pollLogs(logCtx, r.logCursor())
	r.scanReports()

	ticker := time.NewTicker(r.interval)
	defer ticker.Stop()
	var deadline <-chan time.Time
	if duration > 0 {
		deadline = time.After(duration)
	}
	last := time.Now()
	for {
		started := time.Now()
		if err := r.step(started.Sub(last)); err != nil && !errors.Is(err, context.Canceled) {
			fmt.Fprintf(os.Stderr, "%s %v\n", started.Format(time.RFC3339), err)
		}
		last = started
		r.tick++
		select {
		case <-ticker.C:
		case <-deadline:
			return r.saveProgress()
		case <-ctx.Done():
			return r.saveProgress()
		}
	}
}
