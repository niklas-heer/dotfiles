package main

import (
	"database/sql"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"
)

func buildBinary(t *testing.T) string {
	t.Helper()
	binary := filepath.Join(t.TempDir(), "cpuflight")
	if output, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, output)
	}
	return binary
}

// TestRecordsAndReportsARealProcess drives the real commands: a process that
// burns CPU must appear in the database with its CPU and survive a restart.
func TestRecordsAndReportsARealProcess(t *testing.T) {
	binary := buildBinary(t)
	database := filepath.Join(t.TempDir(), "with space", "flight.sqlite")

	burner := exec.Command("/bin/sh", "-c", "while :; do :; done")
	if err := burner.Start(); err != nil {
		t.Fatal(err)
	}
	defer burner.Process.Kill()

	run := func() {
		if output, err := exec.Command(binary, "--db", database, "record", "--interval", "0.5", "--duration", "3").CombinedOutput(); err != nil {
			t.Fatalf("record: %v\n%s", err, output)
		}
	}
	run()

	db, err := sql.Open("sqlite3", databaseURL(database, "mode=ro"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var cpu float64
	var rows int
	query := "SELECT count(*), coalesce(sum(cpu_seconds), 0) FROM processes WHERE pid = ?"
	if err = db.QueryRow(query, burner.Process.Pid).Scan(&rows, &cpu); err != nil {
		t.Fatal(err)
	}
	if rows != 1 || cpu < 1 {
		t.Fatalf("burner has %d rows and %.2f CPU-seconds, want 1 row and at least 1", rows, cpu)
	}

	run()
	var again int
	if err = db.QueryRow(query, burner.Process.Pid).Scan(&again, &cpu); err != nil {
		t.Fatal(err)
	}
	if again != 1 {
		t.Fatalf("restart created %d rows for one process", again)
	}
	if cpu > 7 {
		t.Fatalf("restart recounted the process: %.2f CPU-seconds over about 6 seconds", cpu)
	}

	output, err := exec.Command(binary, "--db", database, "report", "--last", "1m").CombinedOutput()
	if err != nil {
		t.Fatalf("report: %v\n%s", err, output)
	}
	for _, section := range []string{"By owner", "By program", "Timeline", "System events"} {
		if !strings.Contains(string(output), section) {
			t.Errorf("report lacks %q:\n%s", section, output)
		}
	}
	if output, err = exec.Command(binary, "--db", database, "status").CombinedOutput(); err != nil || !strings.Contains(string(output), "Recording") {
		t.Fatalf("status: %v\n%s", err, output)
	}
	info, err := os.Stat(database)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("database mode = %v, it must be private", info.Mode().Perm())
	}
}

// TestNativeReadingsAgreeWithPS guards the kernel calls against the tool they
// replaced.
func TestNativeReadingsAgreeWithPS(t *testing.T) {
	sys, err := newNative()
	if err != nil {
		t.Fatal(err)
	}
	processes, err := sys.list()
	if err != nil {
		t.Fatal(err)
	}
	output, err := exec.Command("/bin/ps", "-A", "-o", "pid=,rss=,time=").Output()
	if err != nil {
		t.Fatal(err)
	}
	usage := parsePS(output)
	own, matched, far := 0, 0, 0
	for i := range processes {
		process := &processes[i]
		pid := process.Proc.P_pid
		reading, known := usage[pid]
		if !known || process.Proc.P_stat == zombieState || process.Eproc.Ucred.Uid != sys.ownUID {
			continue
		}
		cpu, rss, ok := sys.usage(pid)
		if !ok {
			continue
		}
		own++
		if cpu < reading.cpu-1 || cpu > reading.cpu+1 {
			far++
			t.Logf("pid %d cpu %.2f, ps says %.2f", pid, cpu, reading.cpu)
			continue
		}
		if rss > reading.rss/2 && rss < reading.rss*2+65536 {
			matched++
		}
	}
	if own < 10 || far > own/20 || matched < own*9/10 {
		t.Fatalf("own processes %d, within limits %d, CPU far off %d", own, matched, far)
	}
}

func TestNamesAgreeWithPS(t *testing.T) {
	sys, err := newNative()
	if err != nil {
		t.Fatal(err)
	}
	processes, err := sys.list()
	if err != nil {
		t.Fatal(err)
	}
	output, err := exec.Command("/bin/ps", "-Aww", "-o", "pid=,comm=").Output()
	if err != nil {
		t.Fatal(err)
	}
	names := map[int32]string{}
	for _, line := range strings.Split(string(output), "\n") {
		pid, rest, ok := strings.Cut(strings.TrimSpace(line), " ")
		if number, numberErr := strconv.Atoi(pid); ok && numberErr == nil {
			names[int32(number)] = filepath.Base(strings.TrimSpace(rest))
		}
	}
	checked, wrong := 0, 0
	for i := range processes {
		process := &processes[i]
		pid := process.Proc.P_pid
		want, known := names[pid]
		if !known || pid <= 0 || process.Proc.P_stat == zombieState {
			continue
		}
		_, argv, _ := sys.arguments(pid)
		got := processName(argv, sys.program(pid), string(process.Proc.P_comm[:]))
		checked++
		if got != want {
			wrong++
			t.Logf("%s", fmt.Sprintf("pid %d name %q, ps says %q", pid, got, want))
		}
	}
	if checked < 50 || wrong > checked/20 {
		t.Fatalf("%d of %d names differ from ps", wrong, checked)
	}
}

func TestBusyTicksAdvance(t *testing.T) {
	sys, err := newNative()
	if err != nil {
		t.Fatal(err)
	}
	first, ok := sys.busyMS()
	if !ok {
		t.Fatal("no CPU counters")
	}
	for deadline := time.Now().Add(100 * time.Millisecond); time.Now().Before(deadline); {
	}
	if second, _ := sys.busyMS(); second <= first {
		t.Fatalf("busy time went from %d to %d during a busy loop", first, second)
	}
}
