import { createHash } from "node:crypto";
import { join } from "node:path";

import { runGit } from "../lib/git.ts";

export type ExecutionMode = "staged" | "worktree";
export type FileSource = "index" | "worktree";
export type DiffRepresentation = "full" | "trimmed" | "stat" | "filename-only";

export type ScopedFile = {
  path: string;
  previousPath?: string;
  status: "A" | "M" | "D" | "R";
  source: FileSource;
  untracked?: boolean;
  binary: boolean;
  diffFingerprint: string;
  worktreeFingerprint?: string;
  fullDiff?: string;
  trimmedDiff?: string;
  statSummary: string;
  contentPreview?: string;
  representation: DiffRepresentation;
};

export type GatheredContext = {
  repoRoot: string;
  mode: ExecutionMode;
  recentCommits: string[];
  files: ScopedFile[];
};

type DiffRecord = {
  path: string;
  previousPath?: string;
  status: "A" | "M" | "D" | "R";
  untracked?: boolean;
};

const DIFF_LINE_BUDGET = 8000;
const TRIMMED_DIFF_LINES = 200;
const CONTENT_PREVIEW_LINES = 200;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function splitNulDelimited(value: string) {
  return value.split("\0").filter(Boolean);
}

function countLines(value: string) {
  if (!value) {
    return 0;
  }

  return value.split("\n").length;
}

function trimLines(value: string, maxLines: number) {
  const lines = value.split("\n");
  if (lines.length <= maxLines) {
    return value;
  }

  return `${lines.slice(0, maxLines).join("\n")}\n...`;
}

function parseNameStatus(output: string): DiffRecord[] {
  const tokens = splitNulDelimited(output);
  const records: DiffRecord[] = [];

  for (let index = 0; index < tokens.length; ) {
    const rawStatus = tokens[index++];
    const status = rawStatus[0] as DiffRecord["status"];

    if (status === "R") {
      const previousPath = tokens[index++];
      const path = tokens[index++];
      records.push({ path, previousPath, status: "R" });
      continue;
    }

    const path = tokens[index++];
    if (!path || !["A", "M", "D"].includes(status)) {
      continue;
    }

    records.push({ path, status });
  }

  return records;
}

async function getRepoRoot(cwd: string) {
  const result = await runGit(["rev-parse", "--show-toplevel"], { cwd });
  return result.stdout.trim();
}

async function getMode(cwd: string): Promise<ExecutionMode> {
  const staged = await runGit(["diff", "--cached", "--name-only"], { cwd });
  return staged.stdout.trim() ? "staged" : "worktree";
}

async function getRecentCommits(cwd: string) {
  const result = await runGit(["log", "--oneline", "-10"], { cwd, allowExitCodes: [0, 128] });
  return result.exitCode === 0 ? result.stdout.split("\n").filter(Boolean) : [];
}

async function getUntrackedFiles(cwd: string) {
  const result = await runGit(["ls-files", "--others", "--exclude-standard", "-z"], { cwd });
  return splitNulDelimited(result.stdout);
}

async function getScopedDiffRecords(cwd: string, mode: ExecutionMode) {
  const diffArgs = mode === "staged"
    ? ["diff", "--cached", "--name-status", "-z", "--find-renames"]
    : ["diff", "--name-status", "-z", "--find-renames"];

  const tracked = parseNameStatus((await runGit(diffArgs, { cwd })).stdout);
  if (mode === "staged") {
    return tracked;
  }

  const untracked = await getUntrackedFiles(cwd);
  return [
    ...tracked,
    ...untracked.map((path): DiffRecord => ({
      path,
      status: "A",
      untracked: true,
    })),
  ];
}

async function isBinaryFile(cwd: string, record: DiffRecord, mode: ExecutionMode) {
  if (mode === "worktree" && record.status === "A" && !record.previousPath) {
    const file = Bun.file(join(cwd, record.path));
    if (!(await file.exists())) {
      return false;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    return bytes.includes(0);
  }

  const diffArgs = mode === "staged"
    ? ["diff", "--cached", "--numstat", "--find-renames"]
    : ["diff", "--numstat", "--find-renames"];

  const pathArgs = record.previousPath ? [record.previousPath, record.path] : [record.path];
  const result = await runGit([...diffArgs, "--", ...pathArgs], { cwd });
  const firstLine = result.stdout.split("\n").find(Boolean)?.trim() ?? "";
  return firstLine.startsWith("-\t-");
}

async function getStatSummary(cwd: string, record: DiffRecord, mode: ExecutionMode, binary: boolean) {
  if (mode === "worktree" && record.status === "A" && !record.previousPath) {
    if (binary) {
      return `${record.path} (new binary file)`;
    }

    const content = await Bun.file(join(cwd, record.path)).text();
    return `${record.path} | ${countLines(content)} lines`;
  }

  const diffArgs = mode === "staged"
    ? ["diff", "--cached", "--stat", "--find-renames"]
    : ["diff", "--stat", "--find-renames"];
  const pathArgs = record.previousPath ? [record.previousPath, record.path] : [record.path];
  const result = await runGit([...diffArgs, "--", ...pathArgs], { cwd });
  return result.stdout.trim() || `${record.path}`;
}

async function getContentPreview(cwd: string, record: DiffRecord, mode: ExecutionMode, binary: boolean) {
  if (binary || record.status !== "A") {
    return undefined;
  }

  if (mode === "staged") {
    const result = await runGit(["show", `:${record.path}`], { cwd });
    return trimLines(result.stdout, CONTENT_PREVIEW_LINES);
  }

  const file = Bun.file(join(cwd, record.path));
  if (!(await file.exists())) {
    return undefined;
  }

  return trimLines(await file.text(), CONTENT_PREVIEW_LINES);
}

function buildSyntheticDiff(record: DiffRecord, preview: string) {
  return [
    `diff --git a/${record.path} b/${record.path}`,
    "new file mode 100644",
    "index 0000000..0000000",
    "--- /dev/null",
    `+++ b/${record.path}`,
    "@@ -0,0 +1 @@",
    preview,
  ].join("\n");
}

async function getFullDiff(
  cwd: string,
  record: DiffRecord,
  mode: ExecutionMode,
  preview: string | undefined,
  binary: boolean,
) {
  if (binary) {
    return undefined;
  }

  if (mode === "worktree" && record.status === "A" && !record.previousPath) {
    return preview ? buildSyntheticDiff(record, preview) : undefined;
  }

  const diffArgs = mode === "staged"
    ? ["diff", "--cached", "--find-renames", "--no-ext-diff"]
    : ["diff", "--find-renames", "--no-ext-diff"];
  const pathArgs = record.previousPath ? [record.previousPath, record.path] : [record.path];
  const result = await runGit([...diffArgs, "--", ...pathArgs], { cwd });
  return result.stdout.trim() || undefined;
}

async function getWorktreeFingerprint(cwd: string, record: DiffRecord, mode: ExecutionMode) {
  if (mode !== "staged") {
    return undefined;
  }

  const pathArgs = record.previousPath ? [record.previousPath, record.path] : [record.path];
  const result = await runGit(["diff", "--no-ext-diff", "--", ...pathArgs], { cwd });
  return sha256(result.stdout);
}

function chooseRepresentations(files: ScopedFile[]) {
  const eligible = [...files]
    .filter((file) => file.fullDiff)
    .sort((left, right) => countLines(left.fullDiff ?? "") - countLines(right.fullDiff ?? ""));

  let usedLines = 0;
  const fullPaths = new Set<string>();

  for (const file of eligible) {
    const lines = countLines(file.fullDiff ?? "");
    if (usedLines + lines <= DIFF_LINE_BUDGET) {
      fullPaths.add(file.path);
      usedLines += lines;
    }
  }

  for (const file of files) {
    if (file.binary) {
      file.representation = "filename-only";
      continue;
    }

    if (file.fullDiff && fullPaths.has(file.path)) {
      file.representation = "full";
      continue;
    }

    if (file.trimmedDiff) {
      file.representation = "trimmed";
      continue;
    }

    file.representation = "stat";
  }
}

export async function gatherContextForMode(
  cwd: string,
  mode: ExecutionMode,
): Promise<GatheredContext | null> {
  const status = await runGit(["status", "--porcelain"], { cwd });
  if (!status.stdout.trim()) {
    return null;
  }

  const repoRoot = await getRepoRoot(cwd);
  const recentCommits = await getRecentCommits(cwd);
  const records = await getScopedDiffRecords(cwd, mode);

  const files: ScopedFile[] = [];
  for (const record of records) {
    const binary = await isBinaryFile(repoRoot, record, mode);
    const contentPreview = await getContentPreview(repoRoot, record, mode, binary);
    const fullDiff = await getFullDiff(repoRoot, record, mode, contentPreview, binary);
    const trimmedDiff = fullDiff ? trimLines(fullDiff, TRIMMED_DIFF_LINES) : undefined;
    const statSummary = await getStatSummary(repoRoot, record, mode, binary);
    const worktreeFingerprint = await getWorktreeFingerprint(repoRoot, record, mode);

    files.push({
      path: record.path,
      previousPath: record.previousPath,
      status: record.status,
      source: mode === "staged" ? "index" : "worktree",
      untracked: record.untracked,
      binary,
      diffFingerprint: sha256([
        record.status,
        record.previousPath ?? "",
        record.path,
        fullDiff ?? "",
        contentPreview ?? "",
        statSummary,
      ].join("\n")),
      worktreeFingerprint,
      fullDiff,
      trimmedDiff,
      statSummary,
      contentPreview,
      representation: "stat",
    });
  }

  chooseRepresentations(files);

  return {
    repoRoot,
    mode,
    recentCommits,
    files,
  };
}

export async function gatherContext(cwd: string): Promise<GatheredContext | null> {
  const mode = await getMode(cwd);
  return gatherContextForMode(cwd, mode);
}
