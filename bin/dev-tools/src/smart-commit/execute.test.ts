import { rename, unlink } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { runGit } from "../lib/git.ts";
import type { GatheredContext } from "./gather.ts";
import { gatherContext } from "./gather.ts";
import { CommitExecutionError, executeCommitGroups } from "./execute.ts";
import type { ReviewedCommitGroup } from "./review.tsx";
import {
  commitAll,
  getHeadFile,
  getLogSubjects,
  getStatus,
  readRepoFile,
  withRepo,
  writeHook,
  writeRepoFile,
} from "./test-helpers.ts";

function buildGroup(
  context: GatheredContext,
  id: string,
  files: string[],
  subject: string,
): ReviewedCommitGroup {
  const filesByPath = new Map(context.files.map((file) => [file.path, file]));

  return {
    id,
    files,
    reason: subject,
    draft_message: subject,
    scopedFiles: files.map((file) => {
      const scopedFile = filesByPath.get(file);
      if (!scopedFile) {
        throw new Error(`Missing scoped file for ${file}`);
      }

      return scopedFile;
    }),
    message: {
      id,
      subject,
    },
  };
}

async function expectContext(repoRoot: string) {
  const context = await gatherContext(repoRoot);
  expect(context).not.toBeNull();
  return context as GatheredContext;
}

describe("executeCommitGroups", () => {
  test("returns null context when the repo is clean", async () => {
    await withRepo(async (repoRoot) => {
      expect(await gatherContext(repoRoot)).toBeNull();
    });
  });

  test("commits the staged snapshot without pulling in later unstaged edits", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "file.txt", "base\n");
      await commitAll(repoRoot, "chore: initial");

      await writeRepoFile(repoRoot, "file.txt", "base\nstaged\n");
      await runGit(["add", "file.txt"], { cwd: repoRoot });
      await writeRepoFile(repoRoot, "file.txt", "base\nstaged\nunstaged\n");

      const context = await expectContext(repoRoot);
      expect(context.mode).toBe("staged");

      const group = buildGroup(context, "staged-file", ["file.txt"], "fix: commit staged snapshot");
      const result = await executeCommitGroups(context, [group]);

      expect(result.createdCommits).toHaveLength(1);
      expect(await getHeadFile(repoRoot, "file.txt")).toBe("base\nstaged\n");
      expect(await readRepoFile(repoRoot, "file.txt")).toBe("base\nstaged\nunstaged\n");
      expect(await getStatus(repoRoot)).toBe("M file.txt");
    });
  });

  test("commits worktree adds and deletes and leaves the repo clean", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "moved.txt", "same content\n");
      await writeRepoFile(repoRoot, "delete.txt", "remove me\n");
      await writeRepoFile(repoRoot, "keep.txt", "before\n");
      await commitAll(repoRoot, "chore: initial");

      await rename(join(repoRoot, "moved.txt"), join(repoRoot, "renamed.txt"));
      await unlink(join(repoRoot, "delete.txt"));
      await writeRepoFile(repoRoot, "keep.txt", "before\nafter\n");
      await writeRepoFile(repoRoot, "added.txt", "brand new\n");

      const context = await expectContext(repoRoot);
      expect(context.mode).toBe("worktree");
      expect(new Set(context.files.map((file) => file.path))).toEqual(
        new Set(["moved.txt", "delete.txt", "keep.txt", "renamed.txt", "added.txt"]),
      );

      const group = buildGroup(
        context,
        "worktree-changes",
        context.files.map((file) => file.path),
        "feat: apply worktree changes",
      );
      const result = await executeCommitGroups(context, [group]);

      expect(result.createdCommits).toHaveLength(1);
      expect(await getStatus(repoRoot)).toBe("");
      expect(await readRepoFile(repoRoot, "renamed.txt")).toBe("same content\n");
      expect(await readRepoFile(repoRoot, "keep.txt")).toBe("before\nafter\n");
      expect(await readRepoFile(repoRoot, "added.txt")).toBe("brand new\n");
      expect(Bun.file(join(repoRoot, "moved.txt")).exists()).resolves.toBeFalse();
      expect(Bun.file(join(repoRoot, "delete.txt")).exists()).resolves.toBeFalse();
    });
  });

  test("stops before the next commit when a hook causes drift", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "a.txt", "one\n");
      await writeRepoFile(repoRoot, "b.txt", "two\n");
      await commitAll(repoRoot, "chore: initial");

      await writeRepoFile(repoRoot, "a.txt", "one\nchange a\n");
      await writeRepoFile(repoRoot, "b.txt", "two\nchange b\n");
      await writeHook(
        repoRoot,
        "post-commit",
        "repo_root=$(git rev-parse --show-toplevel)\nprintf 'hook drift\\n' >> \"$repo_root/b.txt\"\n",
      );

      const context = await expectContext(repoRoot);
      const groups = [
        buildGroup(context, "group-a", ["a.txt"], "fix: commit a"),
        buildGroup(context, "group-b", ["b.txt"], "fix: commit b"),
      ];

      let error: unknown;
      try {
        await executeCommitGroups(context, groups);
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeInstanceOf(CommitExecutionError);
      expect((error as CommitExecutionError).createdCommits).toEqual([
        { groupId: "group-a", subject: "fix: commit a" },
      ]);
      expect((error as Error).message).toContain("Repo state changed during execution for b.txt");
      expect(await getLogSubjects(repoRoot, 2)).toEqual([
        "fix: commit a",
        "chore: initial",
      ]);
      expect(await getStatus(repoRoot)).toBe("M b.txt");
      expect(await readRepoFile(repoRoot, "b.txt")).toBe("two\nchange b\nhook drift\n");
    });
  });

  test("reports partial success when a later commit fails a hook", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "a.txt", "one\n");
      await writeRepoFile(repoRoot, "b.txt", "two\n");
      await commitAll(repoRoot, "chore: initial");

      await writeRepoFile(repoRoot, "a.txt", "one\nchange a\n");
      await writeRepoFile(repoRoot, "b.txt", "two\nchange b\n");
      await writeHook(
        repoRoot,
        "pre-commit",
        "if git diff --cached --name-only | grep -qx 'b.txt'; then\n  echo 'blocked b.txt' >&2\n  exit 1\nfi\n",
      );

      const context = await expectContext(repoRoot);
      const groups = [
        buildGroup(context, "group-a", ["a.txt"], "fix: commit a"),
        buildGroup(context, "group-b", ["b.txt"], "fix: commit b"),
      ];

      let error: unknown;
      try {
        await executeCommitGroups(context, groups);
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeInstanceOf(CommitExecutionError);
      expect((error as CommitExecutionError).createdCommits).toEqual([
        { groupId: "group-a", subject: "fix: commit a" },
      ]);
      expect((error as Error).message).toContain("blocked b.txt");
      expect(await getLogSubjects(repoRoot, 2)).toEqual([
        "fix: commit a",
        "chore: initial",
      ]);
      expect(await getStatus(repoRoot)).toBe("M b.txt");
    });
  });
});
