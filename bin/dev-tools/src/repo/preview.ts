import { access } from "node:fs/promises";
import { basename, join } from "node:path";

const RESET = "\u001b[0m";
const BOLD = "\u001b[1m";
const DIM = "\u001b[2m";
const GRAY = "\u001b[38;2;86;95;137m";
const BLUE = "\u001b[38;2;122;162;247m";
const CYAN = "\u001b[38;2;125;207;255m";
const GREEN = "\u001b[38;2;158;206;106m";
const ORANGE = "\u001b[38;2;255;158;100m";
const PURPLE = "\u001b[38;2;187;154;247m";
const FG = "\u001b[38;2;192;202;245m";
const RED = "\u001b[38;2;255;117;127m";

type CommandResult = {
  stdout: string;
  exitCode: number;
};

async function run(command: string[], cwd?: string): Promise<CommandResult> {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);

  return { stdout: stdout.trim(), exitCode };
}

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function trimLines(value: string, maxLines: number) {
  const lines = value.split("\n");
  if (lines.length <= maxLines) {
    return value.trim();
  }

  return `${lines.slice(0, maxLines).join("\n").trim()}\n${DIM}...${RESET}`;
}

function section(title: string, body: string) {
  return [
    `${BOLD}${CYAN}${title}${RESET}`,
    `${GRAY}${"─".repeat(Math.max(12, title.length + 6))}${RESET}`,
    body.trim(),
  ].join("\n");
}

function renderStatus(statusOutput: string) {
  const lines = statusOutput.split("\n").filter(Boolean);
  if (lines.length === 0) {
    return `${GREEN}clean${RESET}`;
  }

  const added = lines.filter((line) => line.startsWith("A") || line.startsWith("??")).length;
  const modified = lines.filter((line) => line.startsWith(" M") || line.startsWith("M") || line.startsWith("MM")).length;
  const deleted = lines.filter((line) => line.startsWith(" D") || line.startsWith("D")).length;

  const parts = [
    `${ORANGE}${lines.length} changed${RESET}`,
    added > 0 ? `${GREEN}+${added}${RESET}` : "",
    modified > 0 ? `${CYAN}~${modified}${RESET}` : "",
    deleted > 0 ? `${ORANGE}-${deleted}${RESET}` : "",
  ].filter(Boolean);

  return parts.join("  ");
}

function formatLabel(label: string, value: string) {
  return `${DIM}${label}${RESET} ${value}`;
}

function renderChanges(statusOutput: string) {
  const lines = statusOutput.split("\n").filter(Boolean);
  if (lines.length === 0) {
    return `${GREEN}working tree clean${RESET}`;
  }

  return trimLines(lines.slice(0, 8).map((line) => {
    const code = line.slice(0, 2).trim() || "??";
    const path = line.slice(3);
    const color = code.includes("D")
      ? RED
      : code.includes("A") || code.includes("?")
        ? GREEN
        : code.includes("R")
          ? PURPLE
          : CYAN;

    return `${color}${code.padEnd(2)}${RESET} ${path}`;
  }).join("\n"), 8);
}

async function renderReadme(repoPath: string) {
  const readmePaths = [
    "README.md",
    "readme.md",
    "README",
  ].map((name) => join(repoPath, name));

  const readmePath = await Promise.any(readmePaths.map(async (path) => {
    if (await exists(path)) {
      return path;
    }

    throw new Error("missing");
  })).catch(() => null);

  if (!readmePath) {
    return "";
  }

  const bat = Bun.which("bat") ?? Bun.which("batcat");
  if (bat) {
    const previewWidth = Number.parseInt(process.env.FZF_PREVIEW_COLUMNS ?? "72", 10);
    const result = await run([
      bat,
      "--language=markdown",
      "--style=plain",
      "--color=always",
      "--paging=never",
      "--wrap=character",
      "--terminal-width",
      String(Math.max(40, previewWidth - 4)),
      "--line-range",
      "1:40",
      readmePath,
    ]);
    if (result.exitCode === 0 && result.stdout) {
      return trimLines(result.stdout, 40);
    }
  }

  const glow = Bun.which("glow");
  if (glow) {
    const previewWidth = Number.parseInt(process.env.FZF_PREVIEW_COLUMNS ?? "72", 10);
    const result = await run([
      glow,
      "--style",
      "dark",
      "--width",
      String(Math.max(40, previewWidth - 4)),
      readmePath,
    ]);
    if (result.exitCode === 0 && result.stdout) {
      return trimLines(result.stdout, 40);
    }
  }

  return "";
}

async function renderPreview(repoPath: string) {
  const branch = await run(["git", "-C", repoPath, "branch", "--show-current"]);
  const status = await run(["git", "-C", repoPath, "status", "--short"]);
  const lastCommit = await run(["git", "-C", repoPath, "log", "-1", "--date=relative", "--pretty=format:%h  %s  (%cr)"]);
  const readme = await renderReadme(repoPath);
  const listing = await run([
    "eza",
    "-lhm",
    "--no-permissions",
    "--total-size",
    "--no-user",
    "--color=always",
    "--icons=always",
    "--time-style=relative",
    "--sort=modified",
    "--reverse",
    repoPath,
  ]);

  const summary = [
    `${formatLabel("branch", `${PURPLE}${branch.stdout || "-"}${RESET}`)}  ${formatLabel("status", renderStatus(status.stdout))}`,
    formatLabel("last", `${BLUE}${lastCommit.stdout || "-"}${RESET}`),
  ].join("\n");
  const filesBody = trimLines(
    listing.stdout || `ls -lah ${repoPath}`,
    readme ? 14 : 24,
  );

  const lines = [
    `${BOLD}${FG}${basename(repoPath)}${RESET}  ${DIM}${repoPath}${RESET}`,
    "",
    section("Summary", summary),
    "",
    section("Changes", renderChanges(status.stdout)),
    "",
    section("Files", filesBody),
  ];

  if (readme) {
    lines.push("");
    lines.push(section("README", readme));
  }

  return lines.join("\n");
}

if (import.meta.main) {
  const repoPath = process.argv[2];
  if (!repoPath) {
    process.exit(1);
  }

  process.stdout.write(await renderPreview(repoPath));
}
