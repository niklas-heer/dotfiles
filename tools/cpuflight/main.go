// cpuflight is a flight recorder for CPU and memory on this Mac.
//
// `cpuflight record` runs under launchd and samples every process. It attributes
// each one to the agent or app that started it, and notes when processes end.
// `cpuflight report` explains a time window afterwards, and `cpuflight status`
// shows whether recording is healthy.
//
// Limits: a process that starts and ends between two samples is not seen, though
// its CPU still counts in the system total. macOS only reveals an exit's cause
// to unprivileged tools when the system stores it, so ended processes appear
// with signal, jetsam, thermal and crash events alongside them, up to five
// minutes late. Other users' processes keep their program path but not their
// arguments, and their CPU is read every 10 seconds.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"syscall"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var homeDir = func() string {
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintln(os.Stderr, "cpuflight: cannot find the home directory:", err)
		os.Exit(1)
	}
	return home
}()

func fail(format string, values ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", values...)
	os.Exit(1)
}

func usage() {
	fmt.Fprintln(os.Stderr, `usage: cpuflight <command>

  record   record continuously (run by launchd)
  report   explain what happened in a time window
  status   check that recording is healthy`)
	os.Exit(2)
}

func main() {
	root := flag.NewFlagSet("cpuflight", flag.ExitOnError)
	root.Usage = usage
	database := root.String("db", filepath.Join(homeDir, "Library/Application Support/cpuflight/flight.sqlite"), "")
	root.Parse(os.Args[1:])
	if root.NArg() == 0 {
		usage()
	}
	arguments := root.Args()[1:]
	switch root.Arg(0) {
	case "record":
		recordCommand(*database, arguments)
	case "report":
		reportCommand(*database, arguments)
	case "status":
		statusCommand(*database)
	default:
		usage()
	}
}

func recordCommand(database string, arguments []string) {
	flags := flag.NewFlagSet("record", flag.ExitOnError)
	interval := flags.Float64("interval", 2, "seconds between samples")
	duration := flags.Float64("duration", 0, "stop after this many seconds")
	flags.Parse(arguments)

	// The recorder should weigh as little as possible on the machine it watches.
	runtime.GOMAXPROCS(1)
	debug.SetGCPercent(50)

	recorder, err := NewRecorder(database, time.Duration(*interval*float64(time.Second)))
	if err != nil {
		fail("cpuflight: %v", err)
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()
	if err = recorder.Run(ctx, time.Duration(*duration*float64(time.Second))); err != nil {
		fail("cpuflight: %v", err)
	}
}
