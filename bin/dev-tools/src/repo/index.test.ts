import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { discoverRepoRoots, runRepo } from "./index.ts";

describe("repo tool", () => {
  test("discovers repos from .git directories and files", async () => {
    const root = await mkdtemp(join(tmpdir(), "repo-tool-test-"));

    try {
      const standardRepo = join(root, "Projects", "standard");
      const worktreeRepo = join(root, "ghq", "worktree");

      await mkdir(join(standardRepo, ".git"), { recursive: true });
      await mkdir(worktreeRepo, { recursive: true });
      await writeFile(join(worktreeRepo, ".git"), "gitdir: /tmp/example\n", "utf8");

      const repos = await discoverRepoRoots([
        join(root, "Projects"),
        join(root, "ghq"),
      ]);

      expect(repos).toEqual([
        worktreeRepo,
        standardRepo,
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("prints the selected repo path", async () => {
    let output = "";

    const exitCode = await runRepo(["chez"], {
      stdout: {
        write(chunk: string) {
          output += chunk;
          return true;
        },
      },
      deps: {
        discoverRepoRoots: async () => ["/tmp/alpha", "/tmp/chezmoi"],
        selectRepo: async (repos, query) => {
          expect(repos).toEqual(["/tmp/alpha", "/tmp/chezmoi"]);
          expect(query).toBe("chez");
          return "/tmp/chezmoi";
        },
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toBe("/tmp/chezmoi\n");
  });

  test("lists repos without launching selection", async () => {
    let output = "";

    const exitCode = await runRepo(["--list"], {
      stdout: {
        write(chunk: string) {
          output += chunk;
          return true;
        },
      },
      deps: {
        discoverRepoRoots: async () => ["/tmp/alpha", "/tmp/bravo"],
        selectRepo: async () => {
          throw new Error("selectRepo should not run for --list");
        },
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toBe("/tmp/alpha\n/tmp/bravo\n");
  });

  test("writes a shell action when requested", async () => {
    const root = await mkdtemp(join(tmpdir(), "repo-action-test-"));
    const actionFile = join(root, "action.txt");
    const previous = process.env.NHT_ACTION_FILE;
    let output = "";

    process.env.NHT_ACTION_FILE = actionFile;

    try {
      const exitCode = await runRepo(["chez"], {
        stdout: {
          write(chunk: string) {
            output += chunk;
            return true;
          },
        },
        deps: {
          discoverRepoRoots: async () => ["/tmp/alpha", "/tmp/chezmoi"],
          selectRepo: async () => "/tmp/chezmoi",
        },
      });

      expect(exitCode).toBe(0);
      expect(output).toBe("");
      expect(await readFile(actionFile, "utf8")).toBe("cd\t/tmp/chezmoi\n");
    } finally {
      if (previous === undefined) {
        delete process.env.NHT_ACTION_FILE;
      } else {
        process.env.NHT_ACTION_FILE = previous;
      }

      await rm(root, { recursive: true, force: true });
    }
  });
});
