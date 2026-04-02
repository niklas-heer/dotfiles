import { describe, expect, test } from "bun:test";

import { findMatchingItems, runOpId } from "./index.ts";

function makeItem(id: string, title: string, vaultName = "Personal", additionalInformation?: string) {
  return {
    id,
    title,
    category: "LOGIN",
    vault: {
      id: `${id}-vault`,
      name: vaultName,
    },
    additional_information: additionalInformation,
  };
}

describe("op-id matching", () => {
  test("prefers exact and prefix title matches", () => {
    const items = [
      makeItem("1", "GitHub"),
      makeItem("2", "GitHub Admin"),
      makeItem("3", "My GitHub Token"),
    ];

    expect(findMatchingItems("github", items).map((item) => item.id)).toEqual(["1", "2", "3"]);
  });

  test("falls back to additional information matches", () => {
    const items = [
      makeItem("1", "Netlify", "Personal", "admin@example.com"),
      makeItem("2", "GitHub", "Personal"),
    ];

    expect(findMatchingItems("admin@example.com", items).map((item) => item.id)).toEqual(["1"]);
  });
});

describe("op-id command", () => {
  test("prints the single matching id", async () => {
    let output = "";
    let errput = "";

    const exitCode = await runOpId(["github"], {
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
        listItems: async () => [makeItem("abc123", "GitHub")],
        copyToClipboard: async () => true,
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain("1Password UUID");
    expect(output).toContain("abc123");
    expect(errput).toContain("Copied UUID to clipboard.");
  });

  test("prompts for the query when omitted", async () => {
    let output = "";

    const exitCode = await runOpId([], {
      stdout: {
        write(chunk: string) {
          output += chunk;
          return true;
        },
      },
      deps: {
        promptQuery: async () => "github",
        listItems: async () => [makeItem("abc123", "GitHub")],
        copyToClipboard: async () => false,
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain("abc123");
  });

  test("uses interactive selection when multiple items match", async () => {
    let output = "";
    let errput = "";

    const exitCode = await runOpId(["github"], {
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
        listItems: async () => [
          makeItem("abc123", "GitHub"),
          makeItem("def456", "GitHub Admin"),
        ],
        selectItem: async (_query, items) => items[1] ?? null,
        copyToClipboard: async () => true,
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain("def456");
    expect(errput).toContain("Copied UUID to clipboard.");
  });

  test("passes vault filtering through to item listing", async () => {
    let seenVault: string | undefined;

    const exitCode = await runOpId(["github", "--vault", "Work"], {
      stdout: {
        write() {
          return true;
        },
      },
      deps: {
        listItems: async (vault) => {
          seenVault = vault;
          return [makeItem("abc123", "GitHub", "Work")];
        },
        copyToClipboard: async () => false,
      },
    });

    expect(exitCode).toBe(0);
    expect(seenVault).toBe("Work");
  });

  test("does not fail when clipboard copy is unavailable", async () => {
    let output = "";
    let errput = "";

    const exitCode = await runOpId(["github"], {
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
        listItems: async () => [makeItem("abc123", "GitHub")],
        copyToClipboard: async () => false,
      },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain("abc123");
    expect(errput).toBe("");
  });
});
