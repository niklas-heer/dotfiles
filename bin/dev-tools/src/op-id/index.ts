import { promptForQuery, selectMatchingItem, type OpItemMatch } from "./prompt.tsx";

type OnePasswordItem = {
  id: string;
  title: string;
  category: string;
  vault: {
    id: string;
    name: string;
  };
  additional_information?: string;
};

type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

type OpIdDependencies = {
  listItems: (vault?: string) => Promise<OnePasswordItem[]>;
  promptQuery: () => Promise<string | null>;
  selectItem: (query: string, items: OpItemMatch[]) => Promise<OpItemMatch | null>;
  copyToClipboard: (value: string) => Promise<boolean>;
};

type RunOpIdOptions = {
  stdout?: Pick<typeof process.stdout, "write">;
  stderr?: Pick<typeof process.stderr, "write">;
  deps?: Partial<OpIdDependencies>;
};

const RESET = "\u001b[0m";
const DIM = "\u001b[2m";
const GREEN = "\u001b[32m";
const CYAN = "\u001b[36m";

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

function printHelp(stdout: Pick<typeof process.stdout, "write">) {
  stdout.write(`op-id

Usage:
  bun run src/op-id/index.ts [query] [--vault <name>]

Options:
  --vault <name>  Limit results to a specific 1Password vault
  -h, --help      Show this help message
`);
}

function parseArgs(argv: string[]) {
  const filtered: string[] = [];
  let vault: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === "--vault") {
      vault = argv[index + 1]?.trim();
      index += 1;
      continue;
    }

    filtered.push(arg);
  }

  if (argv.includes("--vault") && !vault) {
    throw new Error("Pass a vault name after --vault.");
  }

  return {
    query: filtered.join(" ").trim() || null,
    vault,
  };
}

async function runCommand(command: string[]): Promise<CommandResult> {
  const proc = Bun.spawn(command, {
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

export async function copyToClipboard(value: string) {
  const candidates: Array<{ command: string[]; name: string }> = [
    { command: ["pbcopy"], name: "pbcopy" },
    { command: ["wl-copy"], name: "wl-copy" },
    { command: ["xclip", "-selection", "clipboard"], name: "xclip" },
    { command: ["xsel", "--clipboard", "--input"], name: "xsel" },
  ];

  for (const candidate of candidates) {
    const binary = Bun.which(candidate.command[0]!);
    if (!binary) {
      continue;
    }

    const proc = Bun.spawn([binary, ...candidate.command.slice(1)], {
      stdin: "pipe",
      stdout: "ignore",
      stderr: "ignore",
    });

    const stdin = proc.stdin;
    if (stdin) {
      stdin.write(value);
      stdin.end();
    }

    const exitCode = await proc.exited;
    if (exitCode === 0) {
      return true;
    }
  }

  return false;
}

export async function listItems(vault?: string) {
  const op = Bun.which("op") ?? "op";
  const command = [op, "item", "list", "--format", "json", ...(vault ? ["--vault", vault] : [])];
  const result = await runCommand(command);

  if (result.exitCode !== 0) {
    throw new Error(result.stderr || "op item list failed");
  }

  const parsed = JSON.parse(result.stdout) as OnePasswordItem[];
  return parsed;
}

function toMatch(item: OnePasswordItem): OpItemMatch {
  return {
    id: item.id,
    title: item.title,
    vaultName: item.vault?.name ?? "-",
    category: item.category,
    additionalInformation: item.additional_information,
  };
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function scoreItem(query: string, item: OnePasswordItem) {
  const q = normalize(query);
  const title = normalize(item.title);
  const info = normalize(item.additional_information ?? "");

  if (title === q) return 0;
  if (title.startsWith(q)) return 1;
  if (title.includes(q)) return 2;
  if (info.includes(q)) return 3;
  return 99;
}

export function findMatchingItems(query: string, items: OnePasswordItem[]) {
  return items
    .map((item) => ({ item, score: scoreItem(query, item) }))
    .filter((entry) => entry.score < 99)
    .sort((left, right) =>
      left.score - right.score
      || left.item.title.localeCompare(right.item.title)
      || left.item.vault.name.localeCompare(right.item.vault.name))
    .map((entry) => entry.item);
}

async function loadDependencies(overrides: Partial<OpIdDependencies> = {}): Promise<OpIdDependencies> {
  return {
    listItems,
    promptQuery: promptForQuery,
    selectItem: selectMatchingItem,
    copyToClipboard,
    ...overrides,
  };
}

async function finishSelection(
  id: string,
  stdout: Pick<typeof process.stdout, "write">,
  stderr: Pick<typeof process.stderr, "write">,
  deps: OpIdDependencies,
) {
  const copied = await deps.copyToClipboard(id);

  writeSection(stdout, "1Password UUID");
  writePair(stdout, "id", id);

  if (copied) {
    writeLine(stderr, colorize(GREEN, "Copied UUID to clipboard."));
  }
}

export async function runOpId(argv: string[], options: RunOpIdOptions = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp(stdout);
    return 0;
  }

  try {
    const { query: parsedQuery, vault } = parseArgs(argv);
    const deps = await loadDependencies(options.deps);
    const query = parsedQuery ?? await deps.promptQuery();

    if (!query) {
      return 0;
    }

    const items = await deps.listItems(vault);
    const matches = findMatchingItems(query, items);

    if (matches.length === 0) {
      throw new Error(`No 1Password items matched ${query}${vault ? ` in ${vault}` : ""}.`);
    }

    if (matches.length === 1) {
      await finishSelection(matches[0]!.id, stdout, stderr, deps);
      return 0;
    }

    const selected = await deps.selectItem(query, matches.map(toMatch));
    if (!selected) {
      return 0;
    }

    await finishSelection(selected.id, stdout, stderr, deps);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${message}\n`);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await runOpId(process.argv.slice(2)));
}
