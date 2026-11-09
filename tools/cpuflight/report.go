package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"regexp"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	bytesPerGBinKB = 1048576.0
	idleKillFilter = "message NOT LIKE 'memorystatus: killing_idle_process%' AND message NOT LIKE 'memorystatus: killing (idle)%'"
)

var spanRE = regexp.MustCompile(`^(\d+)([smhd])$`)

func parseMoment(value string, now time.Time) (time.Time, error) {
	for _, form := range []string{"2006-01-02 15:04:05", "2006-01-02 15:04"} {
		if moment, err := time.ParseInLocation(form, value, time.Local); err == nil {
			return moment, nil
		}
	}
	for _, form := range []string{"15:04:05", "15:04"} {
		if parsed, err := time.ParseInLocation(form, value, time.Local); err == nil {
			moment := time.Date(now.Year(), now.Month(), now.Day(), parsed.Hour(), parsed.Minute(), parsed.Second(), 0, time.Local)
			if moment.After(now) {
				moment = moment.AddDate(0, 0, -1)
			}
			return moment, nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot read time %q; use HH:MM, HH:MM:SS or YYYY-MM-DD HH:MM", value)
}

func parseSpan(value string) (time.Duration, error) {
	match := spanRE.FindStringSubmatch(value)
	if match == nil {
		return 0, fmt.Errorf("cannot read duration %q; use for example 90s, 30m, 2h or 1d", value)
	}
	amount, _ := strconv.Atoi(match[1])
	unit := map[string]time.Duration{"s": time.Second, "m": time.Minute, "h": time.Hour, "d": 24 * time.Hour}[match[2]]
	return time.Duration(amount) * unit, nil
}

// ownerNames turns recorded agent session ids into T3 thread titles.
type ownerNames struct {
	db    *sql.DB
	cache map[string]string
}

func newOwnerNames() *ownerNames {
	names := &ownerNames{cache: map[string]string{}}
	path := homeDir + "/.t3/userdata/statev2.sqlite"
	if _, err := os.Stat(path); err == nil {
		if db, openErr := sql.Open("sqlite3", databaseURL(path, "mode=ro&_busy_timeout=2000")); openErr == nil {
			names.db = db
		}
	}
	return names
}

func (n *ownerNames) title(session string) string {
	if n.db == nil {
		return ""
	}
	pattern := "%" + session + "%"
	for _, query := range []string{
		"SELECT t.title FROM provider_session_runtime p JOIN orchestration_v2_projection_threads t ON t.thread_id = p.thread_id WHERE p.resume_cursor_json LIKE ? OR p.runtime_payload_json LIKE ? LIMIT 1",
		"SELECT t.title FROM orchestration_v2_projection_provider_threads p JOIN orchestration_v2_projection_threads t ON t.thread_id = p.thread_id WHERE p.provider_thread_id LIKE ? OR p.payload_json LIKE ? LIMIT 1",
	} {
		var title sql.NullString
		if err := n.db.QueryRow(query, pattern, pattern).Scan(&title); err == nil && title.Valid {
			return title.String
		}
	}
	return ""
}

func (n *ownerNames) name(owner string) string {
	if cached, ok := n.cache[owner]; ok {
		return cached
	}
	var result string
	switch {
	case strings.HasPrefix(owner, "claude:"):
		session := strings.TrimPrefix(owner, "claude:")
		title := n.title(session)
		if title == "" {
			title = cut(session, 8)
		}
		result = "agent: " + title
	case strings.HasPrefix(owner, "codex:"):
		result = "codex agent"
	default:
		_, after, found := strings.Cut(owner, ":")
		if found {
			result = after
		} else {
			result = owner
		}
	}
	n.cache[owner] = result
	return result
}

func clock(ts int64) string { return time.Unix(ts, 0).Format("15:04:05") }

func openForReading(path string) *sql.DB {
	if _, err := os.Stat(path); err != nil {
		fail("no recording at %s", path)
	}
	db, err := sql.Open("sqlite3", databaseURL(path, "mode=ro&_busy_timeout=10000"))
	if err != nil {
		fail("cpuflight: %v", err)
	}
	return db
}

type systemRow struct {
	ts, cpuMS, intervalMS int64
	load                  float64
	swap                  sql.NullInt64
	disk                  sql.NullFloat64
}

func check(err error) {
	if err != nil {
		fail("cpuflight: %v", err)
	}
}

func reportCommand(database string, arguments []string) {
	flags := flag.NewFlagSet("report", flag.ExitOnError)
	last := flags.String("last", "15m", "window length, such as 90s, 30m or 2h")
	since := flags.String("from", "", "start, as HH:MM or YYYY-MM-DD HH:MM")
	until := flags.String("to", "", "end, as HH:MM or YYYY-MM-DD HH:MM (default now)")
	top := flags.Int("top", 12, "rows per section")
	commands := flags.Bool("commands", false, "show directory and command for ended processes")
	flags.Parse(arguments)

	db := openForReading(database)
	defer db.Close()
	now := time.Now()
	end := now
	var err error
	if *until != "" {
		end, err = parseMoment(*until, now)
		check(err)
	}
	var start time.Time
	if *since != "" {
		start, err = parseMoment(*since, now)
		check(err)
	} else {
		span, spanErr := parseSpan(*last)
		check(spanErr)
		start = end.Add(-span)
	}
	report(db, start.Unix(), end.Unix(), *top, *commands)
}

func readSystem(db *sql.DB, start, end int64) []systemRow {
	rows, err := db.Query("SELECT ts, cpu_ms, interval_ms, load1, swap_used_mb, disk_free_gb FROM system WHERE ts BETWEEN ? AND ? ORDER BY ts", start, end)
	check(err)
	defer rows.Close()
	var result []systemRow
	for rows.Next() {
		var row systemRow
		check(rows.Scan(&row.ts, &row.cpuMS, &row.intervalMS, &row.load, &row.swap, &row.disk))
		result = append(result, row)
	}
	check(rows.Err())
	return result
}

func report(db *sql.DB, start, end int64, top int, commands bool) {
	names := newOwnerNames()
	cores := int64(runtime.NumCPU())
	system := readSystem(db, start, end)
	fmt.Printf("Window %s to %s, %d samples\n", clock(start), clock(end), len(system))
	if len(system) == 0 {
		fmt.Println("Nothing was recorded in this window.")
		return
	}
	printSummary(system, cores)
	printOwners(db, names, start, end, top)
	printPrograms(db, names, start, end, top)
	printTimeline(db, system, cores, start, end)
	printEnded(db, names, start, end, top, commands)
	printEvents(db, start, end, top)
}

func printSummary(system []systemRow, cores int64) {
	var cpu, capacity, swapPeak int64
	load, disk := 0.0, -1.0
	for _, row := range system {
		cpu += row.cpuMS
		capacity += row.intervalMS
		load = max(load, row.load)
		if row.swap.Valid {
			swapPeak = max(swapPeak, row.swap.Int64)
		}
		if row.disk.Valid && (disk < 0 || row.disk.Float64 < disk) {
			disk = row.disk.Float64
		}
	}
	fmt.Printf("CPU %.0f%% of all %d cores on average. Peak load %.1f. Peak swap %d MB. Lowest free disk %.1f GB.\n",
		100*float64(cpu)/float64(max(capacity*cores, 1)), cores, load, swapPeak, max(disk, 0))
	for i := 1; i < len(system); i++ {
		if system[i].ts-system[i-1].ts > 10 {
			fmt.Printf("Recorder gap: nothing recorded from %s to %s\n", clock(system[i-1].ts), clock(system[i].ts))
		}
	}
}

func printOwners(db *sql.DB, names *ownerNames, start, end int64, top int) {
	fmt.Println("\nBy owner")
	rows, err := db.Query("SELECT p.owner, sum(s.cpu_ms)/1000.0 cpu, count(DISTINCT p.id), max(s.rss_kb) FROM samples s JOIN processes p ON p.id = s.proc WHERE s.ts BETWEEN ? AND ? GROUP BY p.owner ORDER BY cpu DESC LIMIT ?", start, end, top)
	check(err)
	defer rows.Close()
	for rows.Next() {
		var owner string
		var cpu float64
		var count int
		var peak sql.NullInt64
		check(rows.Scan(&owner, &cpu, &count, &peak))
		fmt.Printf("  %8.1f CPU-s  %4d procs  peak %6.2f GB  %s\n", cpu, count, float64(peak.Int64)/bytesPerGBinKB, cut(names.name(owner), 80))
	}
	check(rows.Err())
}

func printPrograms(db *sql.DB, names *ownerNames, start, end int64, top int) {
	fmt.Println("\nBy program")
	rows, err := db.Query("SELECT p.label, p.owner, sum(s.cpu_ms)/1000.0 cpu, count(DISTINCT p.id), max(s.rss_kb) FROM samples s JOIN processes p ON p.id = s.proc WHERE s.ts BETWEEN ? AND ? GROUP BY p.label, p.owner ORDER BY cpu DESC LIMIT ?", start, end, top)
	check(err)
	defer rows.Close()
	for rows.Next() {
		var label, owner string
		var cpu float64
		var count int
		var peak sql.NullInt64
		check(rows.Scan(&label, &owner, &cpu, &count, &peak))
		fmt.Printf("  %8.1f CPU-s  %4d procs  peak %6.2f GB  %-28s %s\n", cpu, count, float64(peak.Int64)/bytesPerGBinKB, cut(label, 28), cut(names.name(owner), 58))
	}
	check(rows.Err())
}

func timelineStep(span int64) int64 {
	wanted := max(10, span/24)
	for _, step := range []int64{10, 30, 60, 120, 300, 600, 1800, 3600, 7200} {
		if step >= wanted {
			return step
		}
	}
	return 14400
}

func printTimeline(db *sql.DB, system []systemRow, cores, start, end int64) {
	step := timelineStep(end - start)
	fmt.Printf("\nTimeline, every %ds\n", step)
	type bucket struct {
		cpu, interval int64
		load          float64
		swap          sql.NullInt64
	}
	totals := map[int64]*bucket{}
	for _, row := range system {
		key := row.ts / step * step
		entry := totals[key]
		if entry == nil {
			entry = &bucket{}
			totals[key] = entry
		}
		entry.cpu += row.cpuMS
		entry.interval += row.intervalMS
		entry.load = max(entry.load, row.load)
		if row.swap.Valid {
			entry.swap = row.swap
		}
	}
	leaders := map[int64][]string{}
	rows, err := db.Query("SELECT s.ts / ? * ? bucket, p.label, sum(s.cpu_ms) cpu FROM samples s JOIN processes p ON p.id = s.proc WHERE s.ts BETWEEN ? AND ? GROUP BY bucket, p.label ORDER BY bucket, cpu DESC", step, step, start, end)
	check(err)
	defer rows.Close()
	for rows.Next() {
		var key, cpu int64
		var label string
		check(rows.Scan(&key, &label, &cpu))
		if len(leaders[key]) < 3 {
			leaders[key] = append(leaders[key], fmt.Sprintf("%s %.0fs", cut(label, 24), float64(cpu)/1000))
		}
	}
	check(rows.Err())
	keys := make([]int64, 0, len(totals))
	for key := range totals {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(a, b int) bool { return keys[a] < keys[b] })
	for _, key := range keys {
		entry := totals[key]
		swap := "?"
		if entry.swap.Valid {
			swap = strconv.FormatInt(entry.swap.Int64, 10)
		}
		fmt.Printf("  %s  %3.0f%%  load %5.1f  swap %5s MB  %s\n", clock(key), 100*float64(entry.cpu)/float64(max(entry.interval, 1)*cores), entry.load, swap, strings.Join(leaders[key], ", "))
	}
}

// printEnded keeps the costliest processes when there are more than fit, so
// that many small test runs cannot push out the one that mattered.
func printEnded(db *sql.DB, names *ownerNames, start, end int64, top int, commands bool) {
	fmt.Println("\nSignificant processes that ended")
	const significant = "exited BETWEEN ? AND ? AND (cpu_seconds >= 10 OR peak_rss_kb >= 307200)"
	var total int
	check(db.QueryRow("SELECT count(*) FROM processes WHERE "+significant, start, end).Scan(&total))
	limit := top * 3
	rows, err := db.Query("SELECT exited, label, started, cpu_seconds, peak_rss_kb, owner, cwd, command FROM (SELECT * FROM processes WHERE "+significant+" ORDER BY cpu_seconds DESC LIMIT ?) ORDER BY exited", start, end, limit)
	check(err)
	defer rows.Close()
	if total == 0 {
		fmt.Println("  none")
	}
	for rows.Next() {
		var exited, started, peak int64
		var cpu float64
		var label, owner string
		var cwd, command sql.NullString
		check(rows.Scan(&exited, &label, &started, &cpu, &peak, &owner, &cwd, &command))
		fmt.Printf("  %s  %-24s ran %5ds  %7.1f CPU-s  peak %5.2f GB  %s\n", clock(exited), cut(label, 24), exited-started, cpu, float64(peak)/bytesPerGBinKB, cut(names.name(owner), 50))
		if commands {
			directory := cwd.String
			if directory == "" {
				directory = "?"
			}
			fmt.Printf("      cwd %s\n      %s\n", directory, cut(command.String, 200))
		}
	}
	check(rows.Err())
	if total > limit {
		fmt.Printf("  and %d smaller ones; narrow the window or raise --top to see them\n", total-limit)
	}
}

func printEvents(db *sql.DB, start, end int64, top int) {
	fmt.Println("\nSystem events")
	var total, idle int
	check(db.QueryRow("SELECT count(*) FROM events WHERE ts BETWEEN ? AND ? AND "+idleKillFilter, start, end).Scan(&total))
	check(db.QueryRow("SELECT count(*) FROM events WHERE ts BETWEEN ? AND ?", start, end).Scan(&idle))
	idle -= total
	limit := top * 4
	rows, err := db.Query("SELECT ts, kind, message FROM events WHERE ts BETWEEN ? AND ? AND "+idleKillFilter+" ORDER BY ts LIMIT ?", start, end, limit)
	check(err)
	defer rows.Close()
	if total == 0 {
		fmt.Println("  none")
	}
	for rows.Next() {
		var ts int64
		var kind, message string
		check(rows.Scan(&ts, &kind, &message))
		fmt.Printf("  %s  %-12s %s\n", clock(ts), kind, cut(message, 170))
	}
	check(rows.Err())
	if total > limit {
		fmt.Printf("  and %d more; narrow the window or raise --top to see them\n", total-limit)
	}
	if idle > 0 {
		fmt.Printf("  %d routine kills of idle system services are not shown\n", idle)
	}
}

func statusCommand(database string) {
	db := openForReading(database)
	defer db.Close()
	var first, last sql.NullInt64
	var count, processes int
	check(db.QueryRow("SELECT min(ts), max(ts), count(*) FROM system").Scan(&first, &last, &count))
	if !last.Valid {
		fail("recording exists but holds no samples yet")
	}
	check(db.QueryRow("SELECT count(*) FROM processes").Scan(&processes))
	age := time.Now().Unix() - last.Int64
	state := "Recording"
	if age > 15 {
		state = "NOT recording"
	}
	fmt.Printf("Last sample %ds ago (%s). %s.\n", age, clock(last.Int64), state)
	fmt.Printf("History from %s, %d samples, %d processes.\n", time.Unix(first.Int64, 0).Format("2006-01-02 15:04"), count, processes)
	var size int64
	for _, suffix := range []string{"", "-wal"} {
		if info, err := os.Stat(database + suffix); err == nil {
			size += info.Size()
		}
	}
	fmt.Printf("Database %.1f MB at %s\n", float64(size)/1e6, database)
	if age > 15 {
		os.Exit(1)
	}
}
