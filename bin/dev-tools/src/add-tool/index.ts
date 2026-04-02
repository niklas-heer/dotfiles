import { access, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import { generateObject } from "ai";
import { z } from "zod";

import { MODELS, getOpenRouterProvider } from "../lib/llm.ts";
import { promptForManager, promptForName } from "./prompt.tsx";

type Manager = "brew" | "bun";

type ToolMetadata = {
  name: string;
  description: string;
  homepage?: string;
  source: string;
};

type RunCommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

type AddToolDependencies = {
  fetchMetadata: (manager: Manager, name: string) => Promise<ToolMetadata>;
  generateComment: (manager: Manager, metadata: ToolMetadata) => Promise<string>;
  promptName: () => Promise<string | null>;
  selectManager: (packageName: string) => Promise<Manager | null>;
  readTextFile: typeof readFile;
  writeTextFile: typeof writeFile;
};

type RunAddToolOptions = {
  cwd?: string;
  stdout?: Pick<typeof process.stdout, "write">;
  stderr?: Pick<typeof process.stderr, "write">;
  deps?: Partial<AddToolDependencies>;
};

const commentSchema = z.object({
  comment: z.string().min(1).max(80),
});
const RESET = "\u001b[0m";
const DIM = "\u001b[2m";
const GREEN = "\u001b[32m";
const CYAN = "\u001b[36m";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function colorize(color: string, message: string) {
  return `${color}${message}${RESET}`;
}

function writeLine(output: Pick<typeof process.stdout, "write"> | Pick<typeof process.stderr, "write">, message = "") {
  output.write(`${message}\n`);
}

function writeSection(output: Pick<typeof process.stdout, "write">, title: string) {
  writeLine(output, colorize(CYAN, title));
}

function writePair(output: Pick<typeof process.stdout, "write">, label: string, value: string) {
  writeLine(output, `${DIM}${label}:${RESET} ${value}`);
}

async function withStepSpinner<T>(
  label: string,
  stderr: Pick<typeof process.stderr, "write">,
  task: () => Promise<T>,
) {
  if (stderr !== process.stderr || !process.stderr.isTTY) {
    writeLine(stderr, `${label}...`);
    return task();
  }

  let frameIndex = 0;
  const renderFrame = () => {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    frameIndex += 1;
    process.stderr.write(`\r${colorize(CYAN, `${frame} ${label}`)}`);
  };

  renderFrame();
  const interval = setInterval(renderFrame, 80);

  try {
    const result = await task();
    clearInterval(interval);
    process.stderr.write(`\r${colorize(GREEN, `✓ ${label}`)}\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    process.stderr.write(`\r${label}\n`);
    throw error;
  }
}

function printHelp(stdout: Pick<typeof process.stdout, "write">) {
  stdout.write(`add-tool

Usage:
  bun run src/add-tool/index.ts [package] [--dry-run]
  bun run src/add-tool/index.ts <package> [--dry-run]
  bun run src/add-tool/index.ts --brew <formula> [--dry-run]
  bun run src/add-tool/index.ts --bun <package> [--dry-run]

Options:
  --brew      Add a Homebrew formula entry to Brewfile
  --bun       Add a Bun global package entry to Bunfile
              If neither flag is passed, choose interactively
  --dry-run   Print the planned change without writing files
  -h, --help  Show this help message
`);
}

function compareNames(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

function splitLines(value: string) {
  return value.replace(/\r\n/g, "\n").split("\n");
}

function normalizeComment(value: string) {
  return value
    .replace(/^#+\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?:;]+$/, "");
}

function fallbackComment(metadata: ToolMetadata) {
  const description = normalizeComment(metadata.description);
  if (!description) {
    return "tool description pending";
  }

  const withoutName = description.replace(new RegExp(`^${metadata.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:-]?\\s*`, "i"), "");
  const firstClause = withoutName.split(/[.;]/, 1)[0]?.trim() ?? withoutName;
  return normalizeComment(firstClause || description).slice(0, 80);
}

async function runCommand(command: string[], cwd?: string): Promise<RunCommandResult> {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    exitCode,
  };
}

async function fetchBrewMetadata(name: string): Promise<ToolMetadata> {
  const brew = Bun.which("brew") ?? "/opt/homebrew/bin/brew";
  const result = await runCommand([brew, "info", "--json=v2", "--formula", name]);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || `brew info failed for ${name}`);
  }

  const parsed = JSON.parse(result.stdout) as {
    formulae?: Array<{
      name?: string;
      desc?: string;
      homepage?: string;
    }>;
  };
  const formula = parsed.formulae?.[0];

  if (!formula?.name || !formula.desc) {
    throw new Error(`Could not find formula metadata for ${name}`);
  }

  return {
    name: formula.name,
    description: formula.desc,
    homepage: formula.homepage,
    source: "homebrew",
  };
}

async function fetchBunMetadata(name: string): Promise<ToolMetadata> {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`npm registry lookup failed for ${name} (${response.status})`);
  }

  const parsed = await response.json() as {
    description?: string;
    homepage?: string | { url?: string };
    "dist-tags"?: {
      latest?: string;
    };
    versions?: Record<string, {
      description?: string;
      homepage?: string | { url?: string };
    }>;
  };
  const latestVersion = parsed["dist-tags"]?.latest;
  const latest = latestVersion ? parsed.versions?.[latestVersion] : undefined;
  const description = latest?.description ?? parsed.description;
  const homepageValue = latest?.homepage ?? parsed.homepage;
  const homepage = typeof homepageValue === "string" ? homepageValue : homepageValue?.url;

  if (!description) {
    throw new Error(`Could not find package metadata for ${name}`);
  }

  return {
    name,
    description,
    homepage,
    source: "npm",
  };
}

export async function fetchMetadata(manager: Manager, name: string): Promise<ToolMetadata> {
  return manager === "brew" ? fetchBrewMetadata(name) : fetchBunMetadata(name);
}

export async function generateComment(manager: Manager, metadata: ToolMetadata): Promise<string> {
  try {
    const openrouter = getOpenRouterProvider();
    const result = await generateObject({
      model: openrouter(MODELS.analyzeAndGroup),
      schema: commentSchema,
      schemaName: "manifest_comment",
      schemaDescription: "A terse inline comment for a package entry in a dotfiles manifest.",
      system: [
        "Write a short inline manifest comment for a developer tool entry.",
        "Return an object with a single `comment` field.",
        "Use 2 to 8 words.",
        "Do not include leading # or terminal punctuation.",
        "Prefer plain lowercase phrasing.",
        "Focus on what the tool is for, not marketing language.",
        "Avoid repeating the package manager name.",
      ].join("\n"),
      prompt: [
        `manager: ${manager}`,
        `package: ${metadata.name}`,
        `source: ${metadata.source}`,
        `description: ${metadata.description}`,
        metadata.homepage ? `homepage: ${metadata.homepage}` : "",
      ].filter(Boolean).join("\n"),
    });

    const comment = normalizeComment(result.object.comment);
    if (comment) {
      return comment;
    }
  } catch {
    // Fall back to a compact rewrite of the official metadata.
  }

  return fallbackComment(metadata);
}

function renderEntry(manager: Manager, name: string, comment: string) {
  return manager === "brew"
    ? `brew "${name}" # ${comment}`
    : `${name} # ${comment}`;
}

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findNearestManifest(startDir: string, filename: string) {
  let current = resolve(startDir);

  while (true) {
    const candidate = join(current, filename);
    if (await pathExists(candidate)) {
      return candidate;
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function ensureTrailingNewline(lines: string[]) {
  return `${lines.join("\n").replace(/\n*$/, "")}\n`;
}

function insertIntoBunfile(content: string, name: string, comment: string) {
  const lines = splitLines(content);
  const packageLinePattern = /^([^\s#]+)\s*(?:#.*)?$/;
  const packageIndexes: Array<{ index: number; name: string }> = [];

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(packageLinePattern);
    if (!match) {
      continue;
    }

    const entryName = match[1]!;
    if (entryName === name) {
      throw new Error(`${name} is already present in Bunfile`);
    }

    packageIndexes.push({ index, name: entryName });
  }

  const renderedEntry = renderEntry("bun", name, comment);
  if (packageIndexes.length === 0) {
    const insertionIndex = lines.findLastIndex((line) => line.trim() !== "") + 1;
    lines.splice(insertionIndex, 0, renderedEntry);
    return ensureTrailingNewline(lines);
  }

  const insertionPoint = packageIndexes.find((entry) => compareNames(name, entry.name) < 0);
  if (insertionPoint) {
    lines.splice(insertionPoint.index, 0, renderedEntry);
  } else {
    lines.splice(packageIndexes[packageIndexes.length - 1]!.index + 1, 0, renderedEntry);
  }

  return ensureTrailingNewline(lines);
}

function insertIntoBrewfile(content: string, name: string, comment: string) {
  const lines = splitLines(content);
  const brewPattern = /^brew\s+"([^"]+)"/;
  const cliSectionIndex = lines.findIndex((line) => line.trim() === "# CLI apps");

  for (const line of lines) {
    const match = line.trim().match(brewPattern);
    if (match?.[1] === name) {
      throw new Error(`${name} is already present in Brewfile`);
    }
  }

  const renderedEntry = renderEntry("brew", name, comment);
  const searchStart = cliSectionIndex >= 0 ? cliSectionIndex + 1 : 0;
  let sectionEnd = lines.length;

  for (let index = searchStart; index < lines.length; index += 1) {
    if (index > searchStart && lines[index]!.startsWith("# ")) {
      sectionEnd = index;
      break;
    }
  }

  const brewIndexes: Array<{ index: number; name: string }> = [];
  for (let index = searchStart; index < sectionEnd; index += 1) {
    const match = lines[index]!.trim().match(brewPattern);
    if (match) {
      brewIndexes.push({ index, name: match[1]! });
    }
  }

  if (brewIndexes.length === 0) {
    const insertionIndex = cliSectionIndex >= 0 ? cliSectionIndex + 1 : lines.length;
    lines.splice(insertionIndex, 0, renderedEntry);
    return ensureTrailingNewline(lines);
  }

  const insertionPoint = brewIndexes.find((entry) => compareNames(name, entry.name) < 0);
  if (insertionPoint) {
    lines.splice(insertionPoint.index, 0, renderedEntry);
  } else {
    lines.splice(brewIndexes[brewIndexes.length - 1]!.index + 1, 0, renderedEntry);
  }

  return ensureTrailingNewline(lines);
}

export function applyManifestUpdate(
  manager: Manager,
  content: string,
  name: string,
  comment: string,
) {
  return manager === "brew"
    ? insertIntoBrewfile(content, name, comment)
    : insertIntoBunfile(content, name, comment);
}

function parseArgs(argv: string[]) {
  const args = new Set(argv);
  const brew = args.has("--brew");
  const bun = args.has("--bun");

  if (brew && bun) {
    throw new Error("Pass at most one of --brew or --bun.");
  }

  const filtered = argv.filter((arg) => !["--brew", "--bun", "--dry-run"].includes(arg));
  const name = filtered[0]?.trim();

  return {
    dryRun: args.has("--dry-run"),
    manager: brew ? "brew" as const : bun ? "bun" as const : null,
    name: name || null,
  };
}

export async function promptName() {
  return promptForName();
}

export async function selectManager(packageName: string) {
  return promptForManager(packageName);
}

async function loadDependencies(overrides: Partial<AddToolDependencies> = {}): Promise<AddToolDependencies> {
  return {
    fetchMetadata,
    generateComment,
    promptName,
    selectManager,
    readTextFile: readFile,
    writeTextFile: writeFile,
    ...overrides,
  };
}

export async function runAddTool(argv: string[], options: RunAddToolOptions = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp(stdout);
    return 0;
  }

  try {
    const { dryRun, manager: parsedManager, name: parsedName } = parseArgs(argv);
    const cwd = options.cwd ?? process.cwd();
    const deps = await loadDependencies(options.deps);
    const name = parsedName ?? await deps.promptName();

    if (!name) {
      return 0;
    }

    const manager = parsedManager ?? await deps.selectManager(name);

    if (!manager) {
      return 0;
    }

    const manifestPath = await findNearestManifest(cwd, manager === "brew" ? "Brewfile" : "Bunfile");

    if (!manifestPath) {
      throw new Error(`Could not find ${manager === "brew" ? "Brewfile" : "Bunfile"} from ${cwd}`);
    }

    writeSection(stdout, "Add Tool");
    writePair(stdout, "package", name);
    writePair(stdout, "manager", manager);
    writeLine(stdout);

    const metadata = await withStepSpinner(
      `Looking up ${manager} metadata for ${name}`,
      stderr,
      () => deps.fetchMetadata(manager, name),
    );
    const comment = await withStepSpinner(
      `Generating comment for ${metadata.name}`,
      stderr,
      () => deps.generateComment(manager, metadata),
    );

    const manifestContent = await deps.readTextFile(manifestPath, "utf8");
    const nextContent = applyManifestUpdate(manager, manifestContent, metadata.name, comment);
    const renderedEntry = renderEntry(manager, metadata.name, comment);

    if (dryRun) {
      writeSection(stdout, "Dry Run");
      writePair(stdout, "file", basename(manifestPath));
      writeLine(stdout, renderedEntry);
      return 0;
    }

    await withStepSpinner(
      `Updating ${basename(manifestPath)}`,
      stderr,
      () => deps.writeTextFile(manifestPath, nextContent, "utf8"),
    );

    writeSection(stdout, "Updated");
    writePair(stdout, "file", basename(manifestPath));
    writeLine(stdout, renderedEntry);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${message}\n`);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await runAddTool(process.argv.slice(2)));
}
