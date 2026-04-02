import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  getDecisionTitles,
  getNextDecisionNumber,
  insertDecisionEntry,
  renderDecisionEntry,
  runDecision,
} from "./index.ts";

describe("decision entry rendering", () => {
  test("computes the next decision number from the readme", () => {
    expect(getNextDecisionNumber("### 13 Foo\n### 12 Bar\n")).toBe(14);
    expect(getNextDecisionNumber("")).toBe(0);
  });

  test("extracts decision titles from the readme", () => {
    expect(getDecisionTitles("### 13 Foo\n### 12 Bar\n")).toEqual(["Foo", "Bar"]);
  });

  test("renders an adopted entry in the expected format", () => {
    const entry = renderDecisionEntry(14, {
      title: "Adopting doctor command",
      status: "adopted",
      decision: "I will add a doctor tool.",
      context: "I want quick environment checks.",
      consequences: "I will maintain a list of checks.",
    });

    expect(entry).toContain("### 14 Adopting doctor command");
    expect(entry).toContain("* **Status**: ✅ Adopted");
  });

  test("inserts the new entry directly after the start marker", () => {
    const content = `before
<!-- DECISION LOG START -->

### 13 Existing
* **Status**: ✅ Adopted

<!-- DECISION LOG END -->
after
`;

    const updated = insertDecisionEntry(content, "### 14 New\n* **Status**: ✅ Adopted");
    expect(updated).toContain(`<!-- DECISION LOG START -->

### 14 New
* **Status**: ✅ Adopted

### 13 Existing`);
  });
});

describe("decision command", () => {
  test("writes a new decision entry from AI-generated draft content", async () => {
    const root = await mkdtemp(join(tmpdir(), "decision-test-"));
    const readmePath = join(root, "README.md");
    let output = "";

    await writeFile(readmePath, `# Test

<!-- DECISION LOG START -->

### 1 Existing
* **Status**: ✅ Adopted
* **Decision**: Existing
* **Context**: Existing
* **Consequences**: Existing

<!-- DECISION LOG END -->
`, "utf8");

    try {
      const exitCode = await runDecision([], {
        cwd: root,
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        deps: {
          promptNotes: async () => "I want a quick environment doctor command in nht.",
          promptFollowUp: async () => null,
          promptApproval: async () => true,
          requestDecisionDraft: async () => ({
            kind: "draft",
            draft: {
              title: "Adopting doctor command",
              status: "adopted",
              decision: "I will add a doctor tool.",
              context: "I want quick environment checks.",
              consequences: "I will maintain a list of checks.",
            },
          }),
        },
      });

      expect(exitCode).toBe(0);
      const updated = await readFile(readmePath, "utf8");
      expect(updated).toContain("### 2 Adopting doctor command");
      expect(output).toContain("Decision Draft");
      expect(output).toContain("Decision Added");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("asks a follow-up question when the draft model requests more information", async () => {
    const root = await mkdtemp(join(tmpdir(), "decision-followup-test-"));
    const readmePath = join(root, "README.md");
    const seenNotes: string[] = [];

    await writeFile(readmePath, `# Test

<!-- DECISION LOG START -->

<!-- DECISION LOG END -->
`, "utf8");

    try {
      let callCount = 0;
      const exitCode = await runDecision([], {
        cwd: root,
        stdout: {
          write() {
            return true;
          },
        },
        deps: {
          promptNotes: async () => "I am replacing an older window manager choice.",
          promptFollowUp: async (question) => {
            expect(question).toContain("Which previous decision");
            return "13 Sticking with Amethyst";
          },
          promptApproval: async () => true,
          requestDecisionDraft: async ({ followUps }) => {
            callCount += 1;
            seenNotes.push(followUps.map(({ answer }) => answer).join(","));

            if (callCount === 1) {
              return {
                kind: "question",
                question: "Which previous decision should this supersede?",
              };
            }

            return {
              kind: "draft",
              draft: {
                title: "Trying a new window manager",
                status: "supersedes",
                reference: "13 Sticking with Amethyst",
                decision: "I will try a new window manager.",
                context: "My current setup feels limiting.",
                consequences: "I will update the config and revisit the prior choice.",
              },
            };
          },
        },
      });

      expect(exitCode).toBe(0);
      expect(callCount).toBe(2);
      expect(seenNotes.at(-1)).toContain("13 Sticking with Amethyst");

      const updated = await readFile(readmePath, "utf8");
      expect(updated).toContain("* **Status**: ⬆️ Supersedes [13 Sticking with Amethyst]");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("does not write when approval is declined", async () => {
    const root = await mkdtemp(join(tmpdir(), "decision-no-write-test-"));
    const readmePath = join(root, "README.md");

    await writeFile(readmePath, `# Test

<!-- DECISION LOG START -->

<!-- DECISION LOG END -->
`, "utf8");

    try {
      const exitCode = await runDecision([], {
        cwd: root,
        stdout: {
          write() {
            return true;
          },
        },
        deps: {
          promptNotes: async () => "I want a better tool.",
          promptFollowUp: async () => null,
          promptApproval: async () => false,
          requestDecisionDraft: async () => ({
            kind: "draft",
            draft: {
              title: "Adopting a better tool",
              status: "adopted",
              decision: "I will use a better tool.",
              context: "The old one is awkward.",
              consequences: "I will update my setup.",
            },
          }),
        },
      });

      expect(exitCode).toBe(0);
      const updated = await readFile(readmePath, "utf8");
      expect(updated).not.toContain("### 0 Adopting a better tool");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
