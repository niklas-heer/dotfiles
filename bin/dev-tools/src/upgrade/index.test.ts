import { describe, expect, test } from "bun:test";

import { checkBrewUpgrades, runUpgrade } from "./index.ts";

describe("upgrade tool", () => {
  test("parses brew outdated json into upgrade items", async () => {
    const previousSpawn = Bun.spawn;
    Bun.spawn = ((command: string[]) => {
      expect(command).toEqual(["/opt/homebrew/bin/brew", "outdated", "--json=v2"]);
      const stdout = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify({
            formulae: [
              { name: "bat", installed_versions: ["0.24.0"], current_version: "0.25.0" },
            ],
            casks: [
              { name: "ghostty", installed_versions: ["1.0.0"], current_version: "1.1.0" },
            ],
          })));
          controller.close();
        },
      });
      const stderr = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      return {
        stdout,
        stderr,
        exited: Promise.resolve(0),
      } as ReturnType<typeof Bun.spawn>;
    }) as typeof Bun.spawn;

    try {
      const items = await checkBrewUpgrades();
      expect(items).toEqual([
        { name: "bat", current: "0.24.0", latest: "0.25.0", kind: "formula" },
        { name: "ghostty", current: "1.0.0", latest: "1.1.0", kind: "cask" },
      ]);
    } finally {
      Bun.spawn = previousSpawn;
    }
  });

  test("prints nothing-to-upgrade when both managers are current", async () => {
    let output = "";

    const exitCode = await runUpgrade([], {
      stdout: {
        write(chunk: string) {
          output += chunk;
          return true;
        },
      },
      stderr: {
        write() {
          return true;
        },
      },
      deps: {
        checkBrewUpgrades: async () => [],
        checkBunUpgrades: async () => [],
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain("Nothing to upgrade.");
  });

  test("stops when confirmation is declined", async () => {
    let output = "";
    const commands: string[][] = [];

    const exitCode = await runUpgrade([], {
      stdout: {
        write(chunk: string) {
          output += chunk;
          return true;
        },
      },
      stderr: {
        write() {
          return true;
        },
      },
      deps: {
        checkBrewUpgrades: async () => [{ name: "bat", current: "0.24.0", latest: "0.25.0", kind: "formula" }],
        checkBunUpgrades: async () => [{ name: "tokscale", current: "2.0.17", latest: "2.1.0" }],
        confirmUpgrade: async () => false,
        runCommand: async (command) => {
          commands.push(command);
          return { stdout: "", stderr: "", exitCode: 0 };
        },
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain("homebrew");
    expect(commands).toEqual([]);
  });

  test("runs brew and bun upgrades sequentially when confirmed", async () => {
    const commands: string[][] = [];

    const exitCode = await runUpgrade(["--yes"], {
      stdout: {
        write() {
          return true;
        },
      },
      stderr: {
        write() {
          return true;
        },
      },
      deps: {
        checkBrewUpgrades: async () => [{ name: "bat", current: "0.24.0", latest: "0.25.0", kind: "formula" }],
        checkBunUpgrades: async () => [
          { name: "@openai/codex", current: "0.118.0", latest: "0.119.0" },
          { name: "tokscale", current: "2.0.17", latest: "2.1.0" },
        ],
        runCommand: async (command) => {
          commands.push(command);
          return { stdout: "", stderr: "", exitCode: 0 };
        },
      },
    });

    expect(exitCode).toBe(0);
    expect(commands).toEqual([
      ["/opt/homebrew/bin/brew", "upgrade"],
      ["bun", "install", "-g", "@openai/codex"],
      ["bun", "install", "-g", "tokscale"],
    ]);
  });

  test("supports dry-run without executing commands", async () => {
    let output = "";
    const commands: string[][] = [];

    const exitCode = await runUpgrade(["--dry-run"], {
      stdout: {
        write(chunk: string) {
          output += chunk;
          return true;
        },
      },
      stderr: {
        write() {
          return true;
        },
      },
      deps: {
        checkBrewUpgrades: async () => [],
        checkBunUpgrades: async () => [{ name: "tokscale", current: "2.0.17", latest: "2.1.0" }],
        runCommand: async (command) => {
          commands.push(command);
          return { stdout: "", stderr: "", exitCode: 0 };
        },
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain("tokscale 2.0.17 -> 2.1.0");
    expect(commands).toEqual([]);
  });
});
