package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const (
	commandLimit = 500
	messageLimit = 400
	logTimeForm  = "2006-01-02 15:04:05.000000-0700"
)

var (
	sessionRE     = regexp.MustCompile(`--(?:session-id|resume)[= ]([0-9a-f]{8}-[0-9a-f-]{27})`)
	scratchRE     = regexp.MustCompile(`/claude-\d+/[^/ ]+/([0-9a-f]{8}-[0-9a-f-]{27})/`)
	secretRE      = regexp.MustCompile(`(?i)((?:token|secret|password|passwd|api[_-]?key|authorization|bearer)[=: ]+)\S+`)
	secretValueRE = regexp.MustCompile(`\b(sk-[A-Za-z0-9_-]{10,}|ghp_\w+|github_pat_\w+)\b`)
	appBundleRE   = regexp.MustCompile(`/([^/]+)\.app/`)
	logNoiseRE    = regexp.MustCompile(`(?i)mdworker|mds_stores|quicklook|SIGTERM|^pid/\d+/com\.apple\.[^:]*: exited due to SIGKILL`)
	interpreters  = map[string]bool{
		"node": true, "bun": true, "deno": true, "python": true, "python3": true, "bash": true,
		"sh": true, "zsh": true, "npm": true, "npx": true, "uv": true, "tsx": true,
	}
	knownTools = compileTools(
		"vitest", "tsc", "wrangler", "workerd", "vite", "esbuild", "playwright", "jscpd", "oxlint",
		"eslint", "serve.mjs", "driver.mjs", "cargo", "rustc",
	)
)

type knownTool struct {
	name    string
	pattern *regexp.Regexp
}

func compileTools(names ...string) []knownTool {
	tools := make([]knownTool, 0, len(names))
	for _, name := range names {
		tools = append(tools, knownTool{name, regexp.MustCompile(`(^|[/\s])` + regexp.QuoteMeta(name) + `(\.[cm]?js)?(\s|$|/)`)})
	}
	return tools
}

// cut shortens text to a number of characters without splitting one.
func cut(text string, limit int) string {
	if len(text) <= limit {
		return text
	}
	runes := []rune(text)
	if len(runes) <= limit {
		return text
	}
	return string(runes[:limit])
}

// cleanCommand masks secrets before a command line is stored or printed.
func cleanCommand(command string) string {
	command = secretRE.ReplaceAllString(command, "${1}***")
	command = secretValueRE.ReplaceAllString(command, "***")
	return cut(command, commandLimit)
}

// parseProcArgs decodes KERN_PROCARGS2: a 32-bit argument count, the program
// path, padding NULs, then the arguments. The environment follows them and is
// deliberately never read, because it holds credentials.
func parseProcArgs(buffer []byte) (string, []string, bool) {
	if len(buffer) < 4 {
		return "", nil, false
	}
	count := int(binary.LittleEndian.Uint32(buffer))
	rest := buffer[4:]
	end := bytes.IndexByte(rest, 0)
	if end < 0 {
		return "", nil, false
	}
	program := string(rest[:end])
	rest = bytes.TrimLeft(rest[end:], "\x00")
	arguments := make([]string, 0, min(count, 64))
	for len(arguments) < count && len(rest) > 0 {
		end = bytes.IndexByte(rest, 0)
		if end < 0 {
			arguments = append(arguments, string(rest))
			break
		}
		arguments = append(arguments, string(rest[:end]))
		rest = rest[end+1:]
	}
	return program, arguments, true
}

// labelFor names what a process is doing, looking inside interpreters.
func labelFor(name, command string) string {
	if strings.HasPrefix(name, "Brave") && (strings.Contains(command, "--headless") || strings.Contains(command, "--user-data-dir=")) {
		return "Brave headless"
	}
	if !interpreters[strings.ToLower(name)] {
		return name
	}
	for _, tool := range knownTools {
		if tool.pattern.MatchString(command) {
			return name + ":" + tool.name
		}
	}
	fields := strings.Fields(command)
	for _, argument := range fields[min(1, len(fields)):] {
		if !strings.HasPrefix(argument, "-") {
			return name + ":" + cut(filepath.Base(argument), 40)
		}
	}
	return name
}

// appOwner finds the app a command belongs to. Developer tools and Python
// live inside .app bundles too, but those are runtimes rather than apps.
func appOwner(command string) string {
	if strings.Contains(command, ".app/Contents/Developer/") {
		return ""
	}
	match := appBundleRE.FindStringSubmatch(command)
	if match == nil || match[1] == "Python" {
		return ""
	}
	return match[1]
}

func parseClock(value string) (float64, bool) {
	total := 0.0
	for _, part := range strings.Split(strings.ReplaceAll(value, ",", "."), ":") {
		number, err := strconv.ParseFloat(part, 64)
		if err != nil {
			return 0, false
		}
		total = total*60 + number
	}
	return total, true
}

type psUsage struct {
	cpu float64
	rss int64
}

// parsePS reads `ps -A -o pid=,rss=,time=`.
func parsePS(output []byte) map[int32]psUsage {
	usage := make(map[int32]psUsage, 512)
	for _, line := range bytes.Split(output, []byte{'\n'}) {
		fields := bytes.Fields(line)
		if len(fields) != 3 {
			continue
		}
		pid, err := strconv.ParseInt(string(fields[0]), 10, 32)
		rss, rssErr := strconv.ParseInt(string(fields[1]), 10, 64)
		cpu, ok := parseClock(string(fields[2]))
		if err == nil && rssErr == nil && ok {
			usage[int32(pid)] = psUsage{cpu, rss}
		}
	}
	return usage
}

type event struct {
	ts      int64
	kind    string
	message string
}

// parseLogEntry turns one line of `log show --style ndjson` into an event.
// launchd names the exiting service only in the subsystem field, so it is
// folded into the stored message.
func parseLogEntry(line []byte) (time.Time, string, bool) {
	var entry struct {
		EventMessage     string `json:"eventMessage"`
		Timestamp        string `json:"timestamp"`
		Subsystem        string `json:"subsystem"`
		ProcessImagePath string `json:"processImagePath"`
	}
	if json.Unmarshal(line, &entry) != nil || entry.EventMessage == "" {
		return time.Time{}, "", false
	}
	moment, err := time.Parse(logTimeForm, entry.Timestamp)
	if err != nil {
		return time.Time{}, "", false
	}
	message := entry.EventMessage
	if strings.HasSuffix(entry.ProcessImagePath, "/launchd") && entry.Subsystem != "" {
		message = entry.Subsystem + ": " + message
	}
	if logNoiseRE.MatchString(message) {
		return time.Time{}, "", false
	}
	return moment, cut(message, messageLimit), true
}
