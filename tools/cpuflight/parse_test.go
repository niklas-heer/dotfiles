package main

import (
	"encoding/binary"
	"strings"
	"testing"
)

func procArgs(count uint32, parts ...string) []byte {
	buffer := binary.LittleEndian.AppendUint32(nil, count)
	return append(buffer, strings.Join(parts, "\x00")...)
}

func TestParseProcArgsStopsBeforeTheEnvironment(t *testing.T) {
	buffer := procArgs(2, "/bin/tool", "", "", "tool", "--flag", "API_TOKEN=hunter2", "")
	program, argv, ok := parseProcArgs(buffer)
	if !ok || program != "/bin/tool" {
		t.Fatalf("program = %q, ok = %v", program, ok)
	}
	if got := strings.Join(argv, " "); got != "tool --flag" {
		t.Fatalf("argv = %q, which must not include the environment", got)
	}
}

func TestParseProcArgsRejectsTruncatedData(t *testing.T) {
	if _, _, ok := parseProcArgs([]byte{1, 0}); ok {
		t.Fatal("a buffer shorter than the argument count must fail")
	}
}

func TestCleanCommandMasksSecrets(t *testing.T) {
	for _, secret := range []string{"--token=abc123", "password: abc123", "--api-key abc123", "sk-ant-abcdefghijklmnop", "ghp_abcdefghij"} {
		if cleaned := cleanCommand("tool " + secret); strings.Contains(cleaned, "abc123") || strings.Contains(cleaned, "abcdefghij") {
			t.Errorf("%q kept its secret: %q", secret, cleaned)
		}
	}
}

func TestLabelFor(t *testing.T) {
	cases := []struct{ name, command, want string }{
		{"node", "node /repo/node_modules/.bin/vite --port 1", "node:vite"},
		{"Python", "python3 /a/b/script.py -v", "Python:script.py"},
		{"Brave Browser", "Brave Browser --headless=new", "Brave headless"},
		{"WindowServer", "/System/WindowServer -daemon", "WindowServer"},
		{"node", "node", "node"},
	}
	for _, test := range cases {
		if got := labelFor(test.name, test.command); got != test.want {
			t.Errorf("labelFor(%q, %q) = %q, want %q", test.name, test.command, got, test.want)
		}
	}
}

func TestAppOwnerIgnoresRuntimesInsideBundles(t *testing.T) {
	cases := map[string]string{
		"/Applications/Ardia.app/Contents/MacOS/Ardia":                                                  "Ardia",
		"/Applications/Xcode.app/Contents/Developer/usr/bin/python3 x":                                  "",
		"/opt/homebrew/Frameworks/Python.framework/Versions/3.14/Resources/Python.app/Contents/MacOS/P": "",
	}
	for command, want := range cases {
		if got := appOwner(command); got != want {
			t.Errorf("appOwner(%q) = %q, want %q", command, got, want)
		}
	}
}

func TestParsePS(t *testing.T) {
	usage := parsePS([]byte("  101  2048   1:02.50\n  102 4096 0:00.01\nnot a row\n"))
	if got := usage[101]; got.rss != 2048 || got.cpu != 62.5 {
		t.Fatalf("pid 101 = %+v", got)
	}
	if len(usage) != 2 {
		t.Fatalf("parsed %d rows, want 2", len(usage))
	}
}

func logLine(process, subsystem, message string) []byte {
	return []byte(`{"timestamp":"2026-11-09 20:27:09.256217+0100","processImagePath":"` + process + `","subsystem":"` + subsystem + `","eventMessage":"` + message + `"}`)
}

func TestParseLogEntryNamesTheServiceThatExited(t *testing.T) {
	_, message, ok := parseLogEntry(logLine("/sbin/launchd", "gui/501/com.example.app [42]", "exited due to SIGSEGV"))
	if !ok || message != "gui/501/com.example.app [42]: exited due to SIGSEGV" {
		t.Fatalf("message = %q, ok = %v", message, ok)
	}
}

func TestParseLogEntryDropsRoutineExits(t *testing.T) {
	routine := [][]byte{
		logLine("/sbin/launchd", "user/501/com.apple.mdworker.shared.0B [1]", "exited due to SIGKILL | sent by mds[373]"),
		logLine("/sbin/launchd", "pid/58923/com.apple.SetStoreUpdateService [58930]", "exited due to SIGKILL | sent by launchd[1]"),
	}
	for _, line := range routine {
		if _, message, ok := parseLogEntry(line); ok {
			t.Errorf("kept routine exit %q", message)
		}
	}
	if _, _, ok := parseLogEntry(logLine("/sbin/launchd", "pid/1/net.whatsapp.Extension [2]", "exited due to SIGKILL")); !ok {
		t.Error("dropped a third-party exit")
	}
}

func TestOwnerForFollowsParentsToTheAgent(t *testing.T) {
	r := &Recorder{live: map[int32]*record{}, groupOwner: map[int32]string{}}
	session := "2f8958a5-8c64-4095-a8d0-0351516aad85"
	r.live[10] = &record{pid: 10, ppid: 1, name: "claude", session: session, command: "claude"}
	r.live[20] = &record{pid: 20, ppid: 10, name: "zsh", command: "/bin/zsh"}
	r.live[30] = &record{pid: 30, ppid: 20, name: "node", command: "node vite"}
	if got := r.ownerFor(r.live[30]); got != "claude:"+session {
		t.Fatalf("owner = %q", got)
	}
}

func TestOwnerForTreatsTheRecorderAsItsOwnProgram(t *testing.T) {
	r := &Recorder{live: map[int32]*record{}, groupOwner: map[int32]string{}}
	r.live[10] = &record{pid: 10, ppid: 1, name: "cpuflight", command: "/Users/me/.bin/cpuflight record"}
	r.live[20] = &record{pid: 20, ppid: 10, name: "log", command: "/usr/bin/log show"}
	if got := r.ownerFor(r.live[20]); got != "proc:cpuflight" {
		t.Fatalf("owner = %q", got)
	}
}
