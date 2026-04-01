import { describe, expect, mock, test } from "bun:test";

import type { CommitMessage } from "./messages.ts";
import { runSmartCommit } from "./index.ts";
import { CommitExecutionError } from "./execute.ts";
import { getLogSubjects, getStatus, withRepo, writeRepoFile, commitAll } from "./test-helpers.ts";

describe("runSmartCommit", () => {
  test("stops after review in dry-run mode without creating commits", async () => {
    await withRepo(async (repoRoot) => {
      await writeRepoFile(repoRoot, "file.txt", "before\n");
      await commitAll(repoRoot, "chore: initial");
      await writeRepoFile(repoRoot, "file.txt", "before\nafter\n");

      const executeCommitGroups = mock(async () => {
        throw new Error("executeCommitGroups should not run during --dry-run");
      });

      const exitCode = await runSmartCommit(["--dry-run"], {
        cwd: repoRoot,
        deps: {
          generateCommitPlan: async () => [{
            id: "group-1",
            files: ["file.txt"],
            reason: "Update the file",
            draft_message: "fix: update file",
          }],
          generateCommitMessages: async (): Promise<CommitMessage[]> => [{
            id: "group-1",
            subject: "fix: update file",
          }],
          reviewCommitGroups: async (groups) => ({
            status: "approved",
            groups,
            skippedCount: 0,
          }),
          executeCommitGroups,
          CommitExecutionError,
        },
      });

      expect(exitCode).toBe(0);
      expect(executeCommitGroups).not.toHaveBeenCalled();
      expect(await getLogSubjects(repoRoot, 1)).toEqual(["chore: initial"]);
      expect(await getStatus(repoRoot)).toBe("M file.txt");
    });
  });

  test("aborts before the LLM step when the worktree contains a large generated tree", async () => {
    await withRepo(async (repoRoot) => {
      for (let index = 0; index < 220; index += 1) {
        await writeRepoFile(repoRoot, `bin/dev-tools/node_modules/pkg/file-${index}.js`, "export {};\n");
      }

      const exitCode = await runSmartCommit([], {
        cwd: repoRoot,
        deps: {
          generateCommitPlan: async () => {
            throw new Error("generateCommitPlan should not run for large ignore candidates");
          },
        },
      });

      expect(exitCode).toBe(1);
    });
  });
});
