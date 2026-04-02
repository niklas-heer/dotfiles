import { describe, expect, mock, test } from "bun:test";

import type { GatheredContext, ScopedFile } from "./gather.ts";
import { generateCommitPlan } from "./plan.ts";

function makeFile(path: string): ScopedFile {
  return {
    path,
    status: "M",
    source: "worktree",
    binary: false,
    diffFingerprint: `fingerprint:${path}`,
    statSummary: `${path} | 1 +`,
    representation: "stat",
  };
}

function makeContext(paths: string[]): GatheredContext {
  return {
    repoRoot: "/tmp/test-repo",
    mode: "worktree",
    recentCommits: [],
    files: paths.map(makeFile),
  };
}

describe("generateCommitPlan", () => {
  test("retries when the first plan duplicates a file", async () => {
    const requestCommitPlan = mock(async (_context: GatheredContext, correction?: string) => {
      if (!correction) {
        return {
          object: {
            groups: [
              {
                id: "group-1",
                files: ["a.ts", "b.ts"],
                reason: "first",
                draft_message: "feat: first",
              },
              {
                id: "group-2",
                files: ["b.ts"],
                reason: "second",
                draft_message: "fix: second",
              },
            ],
          },
        };
      }

      expect(correction).toContain("Plan referenced file more than once: b.ts");
      return {
        object: {
          groups: [
            {
              id: "group-1",
              files: ["a.ts"],
              reason: "first",
              draft_message: "feat: first",
            },
            {
              id: "group-2",
              files: ["b.ts"],
              reason: "second",
              draft_message: "fix: second",
            },
          ],
        },
      };
    });

    const plan = await generateCommitPlan(makeContext(["a.ts", "b.ts"]), {
      requestCommitPlan,
    });

    expect(requestCommitPlan).toHaveBeenCalledTimes(2);
    expect(plan.map((group) => group.files)).toEqual([["a.ts"], ["b.ts"]]);
  });

  test("throws after exhausting retries", async () => {
    const requestCommitPlan = mock(async () => ({
      object: {
        groups: [
          {
            id: "group-1",
            files: ["a.ts", "a.ts"],
            reason: "bad",
            draft_message: "feat: bad",
          },
        ],
      },
    }));

    await expect(generateCommitPlan(makeContext(["a.ts"]), {
      requestCommitPlan,
    })).rejects.toThrow("Plan referenced file more than once: a.ts");
    expect(requestCommitPlan).toHaveBeenCalledTimes(3);
  });
});
