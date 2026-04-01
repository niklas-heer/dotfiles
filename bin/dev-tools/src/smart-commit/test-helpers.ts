import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { runGit } from "../lib/git.ts";

export async function createRepo() {
  const repoRoot = await mkdtemp(join(tmpdir(), "smart-commit-test-"));

  await runGit(["init", "-b", "main"], { cwd: repoRoot });
  await runGit(["config", "user.name", "Smart Commit Test"], { cwd: repoRoot });
  await runGit(["config", "user.email", "smart-commit@example.com"], { cwd: repoRoot });
  await runGit(["config", "core.hooksPath", ".git/hooks"], { cwd: repoRoot });

  return repoRoot;
}

export async function withRepo(run: (repoRoot: string) => Promise<void>) {
  const repoRoot = await createRepo();

  try {
    await run(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

export async function writeRepoFile(repoRoot: string, relativePath: string, content: string) {
  await mkdir(join(repoRoot, dirname(relativePath)), { recursive: true });
  await writeFile(join(repoRoot, relativePath), content, "utf8");
}

export async function readRepoFile(repoRoot: string, relativePath: string) {
  return readFile(join(repoRoot, relativePath), "utf8");
}

export async function commitAll(repoRoot: string, message: string) {
  await runGit(["add", "-A"], { cwd: repoRoot });
  await runGit(["commit", "-m", message], { cwd: repoRoot });
}

export async function getStatus(repoRoot: string) {
  return (await runGit(["status", "--short"], { cwd: repoRoot })).stdout.trim();
}

export async function getHeadFile(repoRoot: string, relativePath: string) {
  return (await runGit(["show", `HEAD:${relativePath}`], { cwd: repoRoot })).stdout;
}

export async function getLogSubjects(repoRoot: string, count = 10) {
  return (await runGit(["log", `--format=%s`, `-${count}`], { cwd: repoRoot })).stdout
    .split("\n")
    .filter(Boolean);
}

export async function writeHook(repoRoot: string, name: string, body: string) {
  const hookPath = join(repoRoot, ".git", "hooks", name);
  await writeFile(hookPath, `#!/bin/sh\nset -eu\n${body}`, "utf8");
  await chmod(hookPath, 0o755);
}
