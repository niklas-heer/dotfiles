import { access, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export type ToolMeta = {
  name: string;
  description: string;
  category: string;
  aliases?: string[];
  when?: string;
  examples?: string[];
  notes?: string[];
};

export type RegisteredTool = {
  dirName: string;
  meta: ToolMeta;
  command: string;
};

const srcRoot = new URL("..", import.meta.url);
const srcPath = Bun.fileURLToPath(srcRoot);

async function hasMetaFile(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeMeta(meta: ToolMeta): ToolMeta {
  const aliases = [...new Set(
    (meta.aliases ?? [])
      .map((alias) => alias.trim())
      .filter(Boolean)
      .filter((alias) => alias.toLowerCase() !== meta.name.toLowerCase()),
  )];

  return {
    ...meta,
    category: meta.category.trim(),
    aliases,
    when: meta.when?.trim(),
    examples: meta.examples?.map((example) => example.trim()).filter(Boolean),
    notes: meta.notes?.map((note) => note.trim()).filter(Boolean),
  };
}

async function loadToolMeta(dirName: string): Promise<ToolMeta | null> {
  const metaPath = join(srcPath, dirName, "meta.ts");
  if (!(await hasMetaFile(metaPath))) {
    return null;
  }

  const module = (await import(pathToFileURL(metaPath).href)) as {
    default?: ToolMeta;
  };

  if (!module.default) {
    return null;
  }

  return normalizeMeta(module.default);
}

export function buildToolCommand(dirName: string) {
  return `bun run ${homedir()}/bin/dev-tools/src/${dirName}/index.ts`;
}

export function formatAliases(aliases: string[]) {
  return aliases.length > 0 ? aliases.join(", ") : "-";
}

export function formatRegisterRow(tool: RegisteredTool) {
  return [
    tool.meta.name,
    tool.meta.category,
    tool.meta.description,
    tool.command,
    formatAliases(tool.meta.aliases ?? []),
    tool.dirName,
  ].join("\t");
}

export function findToolMatch(tools: RegisteredTool[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return tools.find((tool) =>
    tool.meta.name.toLowerCase() === normalized
    || (tool.meta.aliases ?? []).some((alias) => alias.toLowerCase() === normalized)
  ) ?? null;
}

export async function listRegisteredTools() {
  const entries = await readdir(srcPath, { withFileTypes: true });
  const tools: RegisteredTool[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "lib") {
      continue;
    }

    const meta = await loadToolMeta(entry.name);
    if (!meta) {
      continue;
    }

    tools.push({
      dirName: entry.name,
      meta,
      command: buildToolCommand(entry.name),
    });
  }

  return tools.sort((left, right) =>
    left.meta.category.localeCompare(right.meta.category)
    || left.meta.name.localeCompare(right.meta.name)
  );
}
