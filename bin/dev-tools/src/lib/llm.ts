import { createOpenAI } from "@ai-sdk/openai";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { initVarlockEnv } from "varlock/env";

export const MODELS = {
  analyzeAndGroup: "openai/gpt-5.4-mini",
  writeDecision: "openai/gpt-5.4-mini",
  writeMessages: "anthropic/claude-sonnet-4.6",
} as const;

let envLoaded = false;

function getProjectRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function getVarlockBinary(projectRoot: string) {
  return join(projectRoot, "node_modules", ".bin", "varlock");
}

function getVarlockEntryPath(projectRoot: string) {
  const deployedSchemaPath = join(projectRoot, ".env.schema");
  if (existsSync(deployedSchemaPath)) {
    return projectRoot;
  }

  const chezmoiSourceSchemaPath = join(projectRoot, "dot_env.schema");
  if (existsSync(chezmoiSourceSchemaPath)) {
    return chezmoiSourceSchemaPath;
  }

  return projectRoot;
}

function ensureVarlockEnvLoaded() {
  if (envLoaded) {
    return;
  }

  const projectRoot = getProjectRoot();
  const varlockBin = getVarlockBinary(projectRoot);
  const entryPath = getVarlockEntryPath(projectRoot);

  try {
    const output = execFileSync(varlockBin, [
      "load",
      "--path",
      entryPath,
      "--format",
      "json-full",
      "--compact",
    ], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    process.env.__VARLOCK_ENV = output.trim();
    initVarlockEnv();
    envLoaded = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load secrets via varlock from ${entryPath}: ${message}`);
  }
}

export function getOpenRouterProvider() {
  ensureVarlockEnvLoaded();
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  return createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    name: "openrouter",
    headers: {
      "HTTP-Referer": "https://github.com/niklas-heer/dotfiles",
      "X-Title": "nht dev-tools",
    },
  });
}
