import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { writeShellCd } from "../lib/shell.ts";

type RepoToolDependencies = {
  discoverRepoRoots: typeof discoverRepoRoots;
  selectRepo: typeof selectRepo;
};

type RunRepoOptions = {
  deps?: Partial<RepoToolDependencies>;
  stdout?: Pick<typeof process.stdout, "write">;
  stderr?: Pick<typeof process.stderr, "write">;
};

const DEFAULT_SEARCH_ROOTS = [
  "~/Projects",
  "~/ghq",
  "~/.local/share/chezmoi",
];
const ANSI_RESET = "\u001b[0m";
const ANSI_BOLD = "\u001b[1m";
const ANSI_DIM = "\u001b[2m";
const PREVIEW_SCRIPT_PATH = join(dirname(fileURLToPath(import.meta.url)), "preview.ts");

function abbreviateHome(path: string) {
  const home = homedir();
  return path === home ? "~" : path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

function buildRepoEntry(path: string) {
  const shortPath = abbreviateHome(path);
  const display = `${ANSI_BOLD}${basename(path)}${ANSI_RESET} ${ANSI_DIM}${shortPath}${ANSI_RESET}`;
  return [
    basename(path),
    display,
    path,
  ].join("\t");
}

function expandHome(path: string) {
  if (path === "~") {
    return homedir();
  }

  if (path.startsWith("~/")) {
    return resolve(homedir(), path.slice(2));
  }

  return resolve(path);
}

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function getDefaultSearchRoots() {
  const expanded = await Promise.all(DEFAULT_SEARCH_ROOTS.map(async (path) => {
    const resolved = expandHome(path);
    return await pathExists(resolved) ? resolved : null;
  }));

  return expanded.filter((path): path is string => path !== null);
}

function normalizeRepoRoot(markerPath: string) {
  return resolve(markerPath.endsWith("/.git") ? dirname(markerPath) : dirname(markerPath));
}

async function runCommand(command: string[], errorMessage: string) {
  const proc = Bun.spawn(command, {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || errorMessage);
  }

  return stdout;
}

function quoteForShell(value: string) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export async function discoverRepoRoots(searchRoots: string[]) {
  if (searchRoots.length === 0) {
    return [];
  }

  const fdBinary = Bun.which("fd") ?? Bun.which("fdfind");
  const stdout = fdBinary
    ? await runCommand(
      [fdBinary, "-H", "-a", "^\\.git$", ...searchRoots],
      "Failed to discover repositories",
    )
    : await runCommand(
      [
        "find",
        ...searchRoots,
        "(",
        "-name",
        ".git",
        ")",
        "(",
        "-type",
        "d",
        "-o",
        "-type",
        "f",
        ")",
        "-print",
      ],
      "Failed to discover repositories",
    );

  const unique = new Set<string>();
  for (const line of stdout.split("\n").filter(Boolean)) {
    unique.add(normalizeRepoRoot(line));
  }

  return [...unique].sort((left, right) => left.localeCompare(right));
}

export async function selectRepo(candidates: string[], query?: string) {
  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0]!;
  }

  const tempDir = await mkdtemp(join(tmpdir(), "repo-picker-"));
  const inputPath = join(tempDir, "repos.txt");

  try {
    const entries = candidates.map(buildRepoEntry);
    await writeFile(inputPath, `${entries.join("\n")}\n`, "utf8");

    const proc = Bun.spawn([
      "fzf",
      "--height=55%",
      "--layout=reverse",
      "--border",
      "--info=inline",
      "--ansi",
      "--color=fg:#c0caf5,bg:-1,hl:#ffc777:bold",
      "--color=fg+:#ffffff,bg+:#565f89,hl+:#ff9e64:bold:underline",
      "--color=info:#7aa2f7,prompt:#7dcfff,pointer:#7dcfff",
      "--color=marker:#4fd6be,spinner:#4fd6be,header:#7aa2f7",
      "--color=border:#3b4261,gutter:#1f2335,separator:#3b4261,scrollbar:#7aa2f7",
      "--delimiter",
      "\t",
      "--with-nth",
      "2",
      "--nth",
      "1,2",
      "--preview",
      `bun run ${quoteForShell(PREVIEW_SCRIPT_PATH)} -- {3}`,
      ...(query ? ["--query", query] : []),
    ], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "inherit",
    });

    const stdin = proc.stdin;
    if (stdin) {
      stdin.write(`${entries.join("\n")}\n`);
      stdin.end();
    }

    const [stdout, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      proc.exited,
    ]);

    if (exitCode === 130 || exitCode === 1) {
      return null;
    }

    if (exitCode !== 0) {
      throw new Error(`fzf failed with exit code ${exitCode}`);
    }

    const selected = stdout.trim();
    if (!selected) {
      return null;
    }

    const parts = selected.split("\t");
    return parts[2] ?? null;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function printHelp(stdout: Pick<typeof process.stdout, "write">) {
  stdout.write(`repo

Usage:
  bun run src/repo/index.ts [query]
  bun run src/repo/index.ts --list

Options:
  --list      Print discovered repositories without selecting
  -h, --help  Show this help message
`);
}

async function loadDependencies(overrides: Partial<RepoToolDependencies> = {}): Promise<RepoToolDependencies> {
  return {
    discoverRepoRoots,
    selectRepo,
    ...overrides,
  };
}

export async function runRepo(argv: string[], options: RunRepoOptions = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp(stdout);
    return 0;
  }

  const listOnly = argv.includes("--list");
  const query = argv.filter((arg) => arg !== "--list").join(" ").trim() || undefined;
  const roots = await getDefaultSearchRoots();
  const deps = await loadDependencies(options.deps);
  const repos = await deps.discoverRepoRoots(roots);

  if (repos.length === 0) {
    stderr.write("No repositories found.\n");
    return 1;
  }

  if (listOnly) {
    stdout.write(`${repos.join("\n")}\n`);
    return 0;
  }

  const selected = await deps.selectRepo(repos, query);
  if (!selected) {
    return 1;
  }

  const wroteShellAction = await writeShellCd(selected);
  if (!wroteShellAction) {
    stdout.write(`${selected}\n`);
  }

  return 0;
}

if (import.meta.main) {
  process.exit(await runRepo(process.argv.slice(2)));
}
