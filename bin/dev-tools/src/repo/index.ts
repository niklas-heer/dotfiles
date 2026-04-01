import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

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

function quoteForShell(value: string) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export async function discoverRepoRoots(searchRoots: string[]) {
  if (searchRoots.length === 0) {
    return [];
  }

  const proc = Bun.spawn([
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
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || "Failed to discover repositories");
  }

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
    await writeFile(inputPath, `${candidates.join("\n")}\n`, "utf8");

    const proc = Bun.spawn([
      "tv",
      "--source-command",
      `cat ${quoteForShell(inputPath)}`,
      "--source-output",
      "{}",
      "--preview-command",
      "eza -lhm --no-permissions --total-size --no-user --color=always --icons=always --time-style=relative --sort=modified --reverse {} 2>/dev/null || ls -lah {}",
      "--height",
      "40",
      "--no-remote",
      "--hide-status-bar",
      "--hide-help-panel",
      ...(query ? ["--input", query] : []),
    ], {
      stdout: "pipe",
      stderr: "inherit",
      stdin: "inherit",
    });

    const [stdout, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      proc.exited,
    ]);

    if (exitCode === 130 || exitCode === 1) {
      return null;
    }

    if (exitCode !== 0) {
      throw new Error(`tv failed with exit code ${exitCode}`);
    }

    return stdout.trim() || null;
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
