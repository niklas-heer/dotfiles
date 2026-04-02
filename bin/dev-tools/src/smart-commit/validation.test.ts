import { describe, expect, test } from "bun:test";

import type { GatheredContext, ScopedFile } from "./gather.ts";
import type { PlannedCommitGroup } from "./groups.ts";
import { normalizeCommitMessages, normalizeCommitSubject, validateMessages } from "./messages.ts";
import { validateCommitPlan } from "./plan.ts";

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

function makeGroup(id: string, files: string[]): PlannedCommitGroup {
  const scopedFiles = files.map(makeFile);

  return {
    id,
    files,
    reason: id,
    draft_message: `chore: ${id}`,
    scopedFiles,
  };
}

describe("smart-commit validation", () => {
  test("rejects commit plans that omit files", () => {
    const context = makeContext(["a.ts", "b.ts"]);

    expect(() => validateCommitPlan(context, [
      { id: "only-a", files: ["a.ts"], reason: "a", draft_message: "chore: a" },
    ])).toThrow("Plan omitted files: b.ts");
  });

  test("rejects commit plans that duplicate files", () => {
    const context = makeContext(["a.ts", "b.ts"]);

    expect(() => validateCommitPlan(context, [
      { id: "first", files: ["a.ts"], reason: "a", draft_message: "chore: a" },
      { id: "second", files: ["a.ts", "b.ts"], reason: "b", draft_message: "chore: b" },
    ])).toThrow("Plan referenced file more than once: a.ts");
  });

  test("rejects commit plans that reference unknown files", () => {
    const context = makeContext(["a.ts"]);

    expect(() => validateCommitPlan(context, [
      { id: "group", files: ["missing.ts"], reason: "missing", draft_message: "chore: missing" },
    ])).toThrow("Plan referenced unknown file: missing.ts");
  });

  test("rejects messages that omit groups", () => {
    const groups = [makeGroup("one", ["a.ts"]), makeGroup("two", ["b.ts"])];

    expect(() => validateMessages(groups, [
      { id: "one", subject: "chore: one" },
    ])).toThrow("Messages omitted groups: two");
  });

  test("rejects messages that duplicate groups", () => {
    const groups = [makeGroup("one", ["a.ts"])];

    expect(() => validateMessages(groups, [
      { id: "one", subject: "chore: one" },
      { id: "one", subject: "chore: duplicate" },
    ])).toThrow("Message referenced group more than once: one");
  });

  test("rejects messages that reference unknown groups", () => {
    const groups = [makeGroup("one", ["a.ts"])];

    expect(() => validateMessages(groups, [
      { id: "missing", subject: "chore: missing" },
    ])).toThrow("Message referenced unknown group: missing");
  });

  test("normalizes conventional commit subjects to include a gitmoji after the prefix", () => {
    expect(normalizeCommitSubject("feat(add-tool): prompt for package name")).toBe(
      "feat(add-tool): ✨ prompt for package name",
    );
    expect(normalizeCommitSubject("fix(repo): 🐛 restore zsh action handling")).toBe(
      "fix(repo): 🐛 restore zsh action handling",
    );
  });

  test("normalizes all generated messages before validation", () => {
    const groups = [makeGroup("one", ["a.ts"])];
    const messages = normalizeCommitMessages([
      { id: "one", subject: "docs(readme): update install section" },
    ]);

    expect(messages[0]?.subject).toBe("docs(readme): 📝 update install section");
    expect(() => validateMessages(groups, messages)).not.toThrow();
  });

  test("rejects subjects that are not conventional commits", () => {
    const groups = [makeGroup("one", ["a.ts"])];

    expect(() => validateMessages(groups, [
      { id: "one", subject: "✨ feat(add-tool): prompt for package name" },
    ])).toThrow("Message subject is not a conventional commit");
  });
});
