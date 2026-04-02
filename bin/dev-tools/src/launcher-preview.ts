import { homedir } from "node:os";
import { join } from "node:path";

import { findToolMatch, listRegisteredTools, type RegisteredTool } from "./lib/registry.ts";

const USE_COLOR = !process.env.NO_COLOR;

const RESET = USE_COLOR ? "\u001b[0m" : "";
const BOLD = USE_COLOR ? "\u001b[1m" : "";
const DIM = USE_COLOR ? "\u001b[2m" : "";
const CYAN = USE_COLOR ? "\u001b[36m" : "";
const GREEN = USE_COLOR ? "\u001b[32m" : "";

type CommandResult = {
  stdout: string;
  exitCode: number;
};

function colorize(color: string, value: string) {
  return `${color}${value}${RESET}`;
}

function heading(value: string) {
  return colorize(`${BOLD}${CYAN}`, value);
}

function subheading(value: string) {
  return colorize(BOLD, value);
}

function muted(value: string) {
  return colorize(DIM, value);
}

async function run(command: string[]) {
  const proc = Bun.spawn(command, {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);

  return {
    stdout: stdout.trim(),
    exitCode,
  } satisfies CommandResult;
}

function trimLines(value: string, maxLines: number) {
  const lines = value
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length <= maxLines) {
    return lines;
  }

  return [
    ...lines.slice(0, maxLines),
    muted("..."),
  ];
}

function renderList(items: string[], bullet = "-") {
  return items.map((item) => `${bullet} ${item}`);
}

async function loadHelp(tool: RegisteredTool) {
  const help = await run(["bun", "run", join(homedir(), "bin", "dev-tools", "src", tool.dirName, "index.ts"), "--help"]);
  if (help.exitCode !== 0 || !help.stdout) {
    return [];
  }

  return trimLines(help.stdout, 14);
}

async function renderPreview(query: string) {
  const tools = await listRegisteredTools();
  const tool = findToolMatch(tools, query);
  if (!tool) {
    return `Unknown nht tool: ${query}`;
  }

  const aliases = tool.meta.aliases ?? [];
  const examples = tool.meta.examples ?? [];
  const notes = tool.meta.notes ?? [];
  const help = await loadHelp(tool);

  const lines = [
    `${heading(tool.meta.name)}  ${muted(tool.meta.category)}`,
    tool.meta.description,
    "",
    subheading("Launch"),
    `- nht ${tool.meta.name}`,
    `- ${tool.command}`,
    "",
    subheading("Use When"),
    tool.meta.when ?? "Use this when it is the fastest path to the job.",
  ];

  if (aliases.length > 0) {
    lines.push("");
    lines.push(subheading("Aliases"));
    lines.push(...renderList(aliases));
  }

  if (examples.length > 0) {
    lines.push("");
    lines.push(subheading("Examples"));
    lines.push(...renderList(examples));
  }

  if (notes.length > 0) {
    lines.push("");
    lines.push(subheading("Notes"));
    lines.push(...renderList(notes));
  }

  if (help.length > 0) {
    lines.push("");
    lines.push(subheading("Help"));
    lines.push(...help.map((line) => (line.startsWith("Usage:") ? colorize(GREEN, line) : line)));
  }

  lines.push("");
  lines.push(muted("Enter run  Ctrl-E help  Ctrl-O source  Ctrl-X actions"));
  return lines.join("\n");
}

if (import.meta.main) {
  const query = process.argv[2]?.trim();

  if (!query) {
    process.exit(1);
  }

  process.stdout.write(await renderPreview(query));
}
