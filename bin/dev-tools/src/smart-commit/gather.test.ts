import { rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { runGit } from "../lib/git.ts";
import { gatherContext } from "./gather.ts";
import { commitAll, withRepo, writeRepoFile } from "./test-helpers.ts";

describe("gatherContext", () => {
  test("detects staged mode and reads only the staged snapshot for partially staged files", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "tracked.txt", "base\n");
      await commitAll(repoRoot, "chore: initial");

      await writeRepoFile(repoRoot, "tracked.txt", "base\nstaged line\n");
      await runGit(["add", "tracked.txt"], { cwd: repoRoot });
      await writeRepoFile(repoRoot, "tracked.txt", "base\nstaged line\nunstaged line\n");

      await writeRepoFile(repoRoot, "new.txt", "staged new file\n");
      await runGit(["add", "new.txt"], { cwd: repoRoot });
      await writeRepoFile(repoRoot, "new.txt", "staged new file\nunstaged extra\n");

      const context = await gatherContext(repoRoot);

      expect(context).not.toBeNull();
      expect(context?.mode).toBe("staged");

      const tracked = context?.files.find((file) => file.path === "tracked.txt");
      const added = context?.files.find((file) => file.path === "new.txt");

      expect(tracked?.source).toBe("index");
      expect(tracked?.fullDiff).toContain("+staged line");
      expect(tracked?.fullDiff).not.toContain("unstaged line");
      expect(tracked?.worktreeFingerprint).toBeTruthy();

      expect(added?.source).toBe("index");
      expect(added?.contentPreview).toBe("staged new file\n");
      expect(added?.contentPreview).not.toContain("unstaged extra");
    });
  });

  test("captures staged renames with previousPath metadata", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "rename-me.txt", "same content\n");
      await commitAll(repoRoot, "chore: initial");

      await rename(join(repoRoot, "rename-me.txt"), join(repoRoot, "renamed.txt"));
      await runGit(["add", "-A"], { cwd: repoRoot });

      const context = await gatherContext(repoRoot);

      expect(context).not.toBeNull();
      expect(context?.mode).toBe("staged");

      const renamed = context?.files.find((file) => file.path === "renamed.txt");

      expect(renamed?.status).toBe("R");
      expect(renamed?.previousPath).toBe("rename-me.txt");
      expect(renamed?.source).toBe("index");
    });
  });

  test("captures worktree deletes, untracked text, and binary files", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "delete-me.txt", "delete me\n");
      await commitAll(repoRoot, "chore: initial");

      await unlink(join(repoRoot, "delete-me.txt"));
      await writeRepoFile(repoRoot, "notes.txt", "hello\nworld\n");
      await writeFile(join(repoRoot, "image.bin"), new Uint8Array([0, 1, 2, 3]));

      const context = await gatherContext(repoRoot);

      expect(context).not.toBeNull();
      expect(context?.mode).toBe("worktree");

      const deleted = context?.files.find((file) => file.path === "delete-me.txt");
      const text = context?.files.find((file) => file.path === "notes.txt");
      const binary = context?.files.find((file) => file.path === "image.bin");

      expect(deleted?.status).toBe("D");

      expect(text?.status).toBe("A");
      expect(text?.binary).toBeFalse();
      expect(text?.contentPreview).toContain("hello\nworld");

      expect(binary?.status).toBe("A");
      expect(binary?.binary).toBeTrue();
      expect(binary?.representation).toBe("filename-only");
      expect(binary?.contentPreview).toBeUndefined();
    });
  });
});
