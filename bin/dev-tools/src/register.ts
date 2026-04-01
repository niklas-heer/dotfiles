import { access, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type ToolMeta = {
  name: string;
  description: string;
};

const srcRoot = new URL(".", import.meta.url);
const srcPath = Bun.fileURLToPath(srcRoot);

async function hasMetaFile(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadToolMeta(dirName: string): Promise<ToolMeta | null> {
  const metaPath = join(srcPath, dirName, "meta.ts");
  if (!(await hasMetaFile(metaPath))) {
    return null;
  }

  const module = (await import(pathToFileURL(metaPath).href)) as {
    default?: ToolMeta;
  };

  return module.default ?? null;
}

async function main() {
  const entries = await readdir(srcPath, { withFileTypes: true });
  const rows: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "lib") {
      continue;
    }

    const meta = await loadToolMeta(entry.name);
    if (!meta) {
      continue;
    }

    const command = `bun run ${homedir()}/bin/dev-tools/src/${entry.name}/index.ts`;
    rows.push(`${meta.name}\t${meta.description}\t${command}`);
  }

  rows.sort((left, right) => left.localeCompare(right));
  process.stdout.write(rows.join("\n"));
  if (rows.length > 0) {
    process.stdout.write("\n");
  }
}

await main();
