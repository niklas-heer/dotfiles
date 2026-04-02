import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { applyManifestUpdate, runAddTool } from "./index.ts";

describe("add-tool manifest updates", () => {
  test("inserts brew tools into the CLI apps section in sorted order", () => {
    const content = `# Basics
brew "git"

# CLI apps
brew "bat" # better cat
brew "fzf" # fuzzy finder

# Desktop apps
cask "zed"
`;

    const updated = applyManifestUpdate("brew", content, "fd", "better find");

    expect(updated).toContain('brew "bat" # better cat\nbrew "fd" # better find\nbrew "fzf" # fuzzy finder');
    expect(updated).toContain('# Desktop apps\ncask "zed"\n');
  });

  test("inserts bun tools in sorted order", () => {
    const content = `# Global bun packages to install
# One package per line

@openai/codex # OpenAI Codex CLI
tokscale # cross-platform token usage + cost tracker
`;

    const updated = applyManifestUpdate("bun", content, "prettier", "code formatter");

    expect(updated).toContain('@openai/codex # OpenAI Codex CLI\nprettier # code formatter\ntokscale # cross-platform token usage + cost tracker\n');
  });

  test("rejects duplicate brew entries", () => {
    const content = `# CLI apps
brew "fd" # better find
`;

    expect(() => applyManifestUpdate("brew", content, "fd", "better find")).toThrow("fd is already present in Brewfile");
  });
});

describe("add-tool command", () => {
  test("writes the updated manifest for brew tools", async () => {
    const root = await mkdtemp(join(tmpdir(), "add-tool-test-"));
    const manifestPath = join(root, "Brewfile");
    let output = "";
    let errput = "";

    await writeFile(manifestPath, `# CLI apps
brew "bat" # better cat
brew "fzf" # fuzzy finder
`, "utf8");

    try {
      const exitCode = await runAddTool(["--brew", "fd"], {
        cwd: root,
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        stderr: {
          write(chunk: string) {
            errput += chunk;
            return true;
          },
        },
        deps: {
          fetchMetadata: async () => ({
            name: "fd",
            description: "Simple, fast and user-friendly alternative to find",
            source: "homebrew",
          }),
          generateComment: async () => "better find",
        },
      });

      expect(exitCode).toBe(0);
      expect(await readFile(manifestPath, "utf8")).toContain('brew "fd" # better find');
      expect(output).toContain("Updated");
      expect(output).toContain('brew "fd" # better find');
      expect(errput).toContain("Looking up brew metadata for fd");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("supports dry-run without writing the manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "add-tool-dry-run-"));
    const manifestPath = join(root, "Bunfile");
    let output = "";
    let errput = "";

    await writeFile(manifestPath, `# Global bun packages to install

tokscale # tracker
`, "utf8");

    try {
      const exitCode = await runAddTool(["--bun", "prettier", "--dry-run"], {
        cwd: root,
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        stderr: {
          write(chunk: string) {
            errput += chunk;
            return true;
          },
        },
        deps: {
          fetchMetadata: async () => ({
            name: "prettier",
            description: "An opinionated code formatter",
            source: "npm",
          }),
          generateComment: async () => "code formatter",
        },
      });

      expect(exitCode).toBe(0);
      expect(await readFile(manifestPath, "utf8")).not.toContain("prettier");
      expect(output).toContain("Dry Run");
      expect(output).toContain("prettier # code formatter");
      expect(errput).toContain("Generating comment for prettier");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("prompts for the manager when no flag is passed", async () => {
    const root = await mkdtemp(join(tmpdir(), "add-tool-prompt-"));
    const manifestPath = join(root, "Brewfile");
    let output = "";
    let errput = "";

    await writeFile(manifestPath, `# CLI apps
brew "bat" # better cat
`, "utf8");

    try {
      const exitCode = await runAddTool(["fd"], {
        cwd: root,
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        stderr: {
          write(chunk: string) {
            errput += chunk;
            return true;
          },
        },
        deps: {
          promptName: async () => "fd",
          selectManager: async () => "brew",
          fetchMetadata: async () => ({
            name: "fd",
            description: "Simple, fast and user-friendly alternative to find",
            source: "homebrew",
          }),
          generateComment: async () => "better find",
        },
      });

      expect(exitCode).toBe(0);
      expect(await readFile(manifestPath, "utf8")).toContain('brew "fd" # better find');
      expect(output).toContain("manager");
      expect(errput).toContain("Looking up brew metadata for fd");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("prompts for the package name when no arguments are passed", async () => {
    const root = await mkdtemp(join(tmpdir(), "add-tool-name-prompt-"));
    const manifestPath = join(root, "Bunfile");
    let output = "";
    let errput = "";

    await writeFile(manifestPath, `# Global bun packages to install
tokscale # tracker
`, "utf8");

    try {
      const exitCode = await runAddTool([], {
        cwd: root,
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        stderr: {
          write(chunk: string) {
            errput += chunk;
            return true;
          },
        },
        deps: {
          promptName: async () => "prettier",
          selectManager: async () => "bun",
          fetchMetadata: async () => ({
            name: "prettier",
            description: "An opinionated code formatter",
            source: "npm",
          }),
          generateComment: async () => "code formatter",
        },
      });

      expect(exitCode).toBe(0);
      expect(await readFile(manifestPath, "utf8")).toContain("prettier # code formatter");
      expect(output).toContain("package");
      expect(errput).toContain("Looking up bun metadata for prettier");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("exits cleanly when package-name prompt is cancelled", async () => {
    const root = await mkdtemp(join(tmpdir(), "add-tool-name-cancel-"));
    const manifestPath = join(root, "Bunfile");
    let output = "";

    await writeFile(manifestPath, `# Global bun packages to install
tokscale # tracker
`, "utf8");

    try {
      const exitCode = await runAddTool([], {
        cwd: root,
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        deps: {
          promptName: async () => null,
          selectManager: async () => {
            throw new Error("selectManager should not run");
          },
          fetchMetadata: async () => {
            throw new Error("fetchMetadata should not run");
          },
          generateComment: async () => {
            throw new Error("generateComment should not run");
          },
        },
      });

      expect(exitCode).toBe(0);
      expect(await readFile(manifestPath, "utf8")).not.toContain("prettier");
      expect(output).toBe("");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("exits cleanly when manager selection is cancelled", async () => {
    const root = await mkdtemp(join(tmpdir(), "add-tool-cancel-"));
    const manifestPath = join(root, "Bunfile");
    let output = "";

    await writeFile(manifestPath, `# Global bun packages to install
tokscale # tracker
`, "utf8");

    try {
      const exitCode = await runAddTool(["prettier"], {
        cwd: root,
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        deps: {
          selectManager: async () => null,
          fetchMetadata: async () => {
            throw new Error("fetchMetadata should not run");
          },
          generateComment: async () => {
            throw new Error("generateComment should not run");
          },
        },
      });

      expect(exitCode).toBe(0);
      expect(await readFile(manifestPath, "utf8")).not.toContain("prettier");
      expect(output).toBe("");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
