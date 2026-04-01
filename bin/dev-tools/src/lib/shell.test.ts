import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  writeShellAction,
  writeShellCd,
  writeShellExec,
  writeShellOpen,
  writeShellPrint,
} from "./shell.ts";

describe("shell action helpers", () => {
  test("writes structured shell actions", async () => {
    const root = await mkdtemp(join(tmpdir(), "shell-action-test-"));
    const actionFile = join(root, "action.txt");
    const previous = process.env.NHT_ACTION_FILE;
    process.env.NHT_ACTION_FILE = actionFile;

    try {
      await writeShellCd("/tmp/repo");
      expect(await readFile(actionFile, "utf8")).toBe("cd\t/tmp/repo\n");

      await writeShellPrint("hello");
      expect(await readFile(actionFile, "utf8")).toBe("print\thello\n");

      await writeShellOpen("https://example.com");
      expect(await readFile(actionFile, "utf8")).toBe("open\thttps://example.com\n");

      await writeShellExec("echo", ["a", "b"]);
      expect(await readFile(actionFile, "utf8")).toBe("exec\techo\ta\tb\n");
    } finally {
      if (previous === undefined) {
        delete process.env.NHT_ACTION_FILE;
      } else {
        process.env.NHT_ACTION_FILE = previous;
      }
      await rm(root, { recursive: true, force: true });
    }
  });

  test("rejects delimiters inside fields", async () => {
    await expect(writeShellAction("print", "bad\tvalue")).rejects.toThrow(
      "Shell action fields cannot contain tabs or newlines",
    );
    await expect(writeShellAction("print", "bad\nvalue")).rejects.toThrow(
      "Shell action fields cannot contain tabs or newlines",
    );
  });
});
