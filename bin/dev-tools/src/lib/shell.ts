import { writeFile } from "node:fs/promises";

export const SHELL_ACTION_FILE_ENV = "NHT_ACTION_FILE";

function validateField(value: string) {
  if (value.includes("\t") || value.includes("\n")) {
    throw new Error("Shell action fields cannot contain tabs or newlines");
  }
}

export async function writeShellAction(action: string, ...values: string[]) {
  validateField(action);
  for (const value of values) {
    validateField(value);
  }

  const target = process.env[SHELL_ACTION_FILE_ENV]?.trim();
  if (!target) {
    return false;
  }

  await writeFile(target, `${[action, ...values].join("\t")}\n`, "utf8");
  return true;
}

export function writeShellCd(path: string) {
  return writeShellAction("cd", path);
}

export function writeShellPrint(message: string) {
  return writeShellAction("print", message);
}

export function writeShellOpen(target: string) {
  return writeShellAction("open", target);
}

export function writeShellExec(program: string, args: string[] = []) {
  return writeShellAction("exec", program, ...args);
}
