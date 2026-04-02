import { describe, expect, test } from "bun:test";

import {
  findToolMatch,
  formatRegisterRow,
  type RegisteredTool,
} from "./registry.ts";

const SMART_COMMIT_TOOL: RegisteredTool = {
  dirName: "smart-commit",
  command: "bun run /Users/nheer/bin/dev-tools/src/smart-commit/index.ts",
  meta: {
    name: "smart-commit",
    description: "Group and commit changes with AI-written messages",
    category: "Git",
    aliases: ["sc", "commit"],
  },
};

describe("tool registry helpers", () => {
  test("matches tools by exact name or alias", () => {
    expect(findToolMatch([SMART_COMMIT_TOOL], "smart-commit")).toBe(SMART_COMMIT_TOOL);
    expect(findToolMatch([SMART_COMMIT_TOOL], "SC")).toBe(SMART_COMMIT_TOOL);
    expect(findToolMatch([SMART_COMMIT_TOOL], "missing")).toBeNull();
  });

  test("formats register rows with stable launcher fields", () => {
    expect(formatRegisterRow(SMART_COMMIT_TOOL)).toBe(
      "smart-commit\tGit\tGroup and commit changes with AI-written messages\tbun run /Users/nheer/bin/dev-tools/src/smart-commit/index.ts\tsc, commit\tsmart-commit",
    );
  });
});
