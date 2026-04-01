import { describe, expect, test } from "bun:test";

import type { GatheredContext, ScopedFile } from "./gather.ts";
import type { PlannedCommitGroup } from "./groups.ts";
import {
  findIgnoreSuggestions,
  isPathCoveredByIgnoreSuggestion,
  summarizeIgnoreCandidates,
} from "./advice.ts";
import { buildGroupingPrompt, buildMessagePrompt } from "./prompt.ts";

function makeFile(path: string, overrides: Partial<ScopedFile> = {}): ScopedFile {
  return {
    path,
    status: "M",
    source: "worktree",
    binary: false,
    diffFingerprint: `fingerprint:${path}`,
    statSummary: `${path} | 1 +`,
    representation: "full",
    fullDiff: `diff --git a/${path} b/${path}\n${"+line\n".repeat(4_000)}`,
    trimmedDiff: `diff --git a/${path} b/${path}\n${"+line\n".repeat(200)}`,
    ...overrides,
  };
}

function makeContext(files: ScopedFile[]): GatheredContext {
  return {
    repoRoot: "/tmp/test-repo",
    mode: "worktree",
    recentCommits: [
      "abc1234 feat: first commit",
      "def5678 fix: second commit",
    ],
    files,
  };
}

describe("smart-commit prompt rendering", () => {
  test("keeps grouping prompts compact while preserving file coverage", () => {
    const files = [
      makeFile("large-a.ts"),
      makeFile("large-b.ts"),
      makeFile("small.ts", {
        statSummary: "small.ts | 3 lines",
        fullDiff: "diff --git a/small.ts b/small.ts\n+small change\n",
        trimmedDiff: "diff --git a/small.ts b/small.ts\n+small change\n",
      }),
    ];

    const prompt = buildGroupingPrompt(makeContext(files));

    expect(prompt).toContain("path: large-a.ts");
    expect(prompt).toContain("path: large-b.ts");
    expect(prompt).toContain("path: small.ts");
    expect(prompt.length).toBeLessThan(180_000);
  });

  test("includes commit group structure without duplicating giant file bodies", () => {
    const scopedFiles = [
      makeFile("src/feature.ts"),
      makeFile("README.md", {
        statSummary: "README.md | 2 lines",
        fullDiff: "diff --git a/README.md b/README.md\n+docs\n",
        trimmedDiff: "diff --git a/README.md b/README.md\n+docs\n",
      }),
    ];
    const context = makeContext(scopedFiles);
    const groups: PlannedCommitGroup[] = [
      {
        id: "group-1",
        files: ["src/feature.ts"],
        reason: "Feature change",
        draft_message: "feat: add feature",
        scopedFiles: [scopedFiles[0]!],
      },
      {
        id: "group-2",
        files: ["README.md"],
        reason: "Docs update",
        draft_message: "docs: update readme",
        scopedFiles: [scopedFiles[1]!],
      },
    ];

    const prompt = buildMessagePrompt(context, groups);

    expect(prompt).toContain("GROUP group-1");
    expect(prompt).toContain("GROUP group-2");
    expect(prompt).toContain("Scoped file details:");
    expect(prompt.length).toBeLessThan(220_000);
  });

  test("finds likely ignore candidates from untracked generated paths", () => {
    const files = [
      makeFile("bin/dev-tools/node_modules/zod/index.js", { untracked: true }),
      makeFile("bin/dev-tools/.env", { untracked: true }),
      makeFile("src/app.ts", { untracked: true }),
    ];
    const suggestions = findIgnoreSuggestions(files);
    const groups = summarizeIgnoreCandidates(files);

    expect(suggestions).toEqual([
      "bin/dev-tools/.env",
      "bin/dev-tools/node_modules/",
    ]);
    expect(groups).toEqual([
      {
        suggestion: "bin/dev-tools/.env",
        count: 1,
        examples: ["bin/dev-tools/.env"],
      },
      {
        suggestion: "bin/dev-tools/node_modules/",
        count: 1,
        examples: ["bin/dev-tools/node_modules/zod/index.js"],
      },
    ]);
    expect(isPathCoveredByIgnoreSuggestion("bin/dev-tools/node_modules/zod/index.js", "bin/dev-tools/node_modules/")).toBeTrue();
  });
});
