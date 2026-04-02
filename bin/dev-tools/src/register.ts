import {
  findToolMatch,
  formatRegisterRow,
  listRegisteredTools,
} from "./lib/registry.ts";

function printHelp() {
  process.stdout.write(`register

Usage:
  bun run src/register.ts
  bun run src/register.ts --resolve <tool-or-alias>

Options:
  --resolve <tool-or-alias>  Print only the matching launch command
  -h, --help                 Show this help message
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    return;
  }

  const tools = await listRegisteredTools();
  const resolveIndex = argv.findIndex((arg) => arg === "--resolve");

  if (resolveIndex >= 0) {
    const query = argv[resolveIndex + 1]?.trim();
    if (!query) {
      throw new Error("Pass a tool name or alias after --resolve.");
    }

    const tool = findToolMatch(tools, query);
    if (!tool) {
      process.exitCode = 1;
      return;
    }

    process.stdout.write(`${tool.command}\n`);
    return;
  }

  const rows = tools.map(formatRegisterRow);
  process.stdout.write(rows.join("\n"));
  if (rows.length > 0) {
    process.stdout.write("\n");
  }
}

await main();
