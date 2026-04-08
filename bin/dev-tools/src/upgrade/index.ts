import { access, readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import {
  withSpinnerTo,
  writeAppHeader,
  writeBullet,
  writeLine,
  writePairTo,
  writeSectionTo,
} from "../lib/ui.ts";
import { confirmUpgrade, type UpgradePreview, type UpgradePreviewItem } from "./prompt.tsx";

type Manager = "brew" | "bun";

type BrewUpgrade = {
  name: string;
  current: string;
  latest: string;
  kind: "formula" | "cask";
};

type BunUpgrade = {
  name: string;
  current: string;
  latest: string;
};

type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

type UpgradeDependencies = {
  readTextFile: typeof readFile;
  checkBrewUpgrades: () => Promise<BrewUpgrade[]>;
  checkBunUpgrades: (cwd: string) => Promise<BunUpgrade[]>;
  confirmUpgrade: (preview: UpgradePreview) => Promise<boolean>;
  runCommand: (command: string[], cwd?: string) => Promise<CommandResult>;
};

type RunUpgradeOptions = {
  cwd?: string;
  stdout?: Pick<typeof process.stdout, "write">;
  stderr?: Pick<typeof process.stderr, "write">;
  deps?: Partial<UpgradeDependencies>;
};

function printHelp(stdout: Pick<typeof process.stdout, "write">) {
  stdout.write(`upgrade

Usage:
  bun run src/upgrade/index.ts [--dry-run] [--yes] [--brew-only|--bun-only]

Options:
  --dry-run    Show the upgrade summary without running upgrades
  --yes        Skip the interactive confirmation prompt
  --brew-only  Only check and run Homebrew upgrades
  --bun-only   Only check and run Bun upgrades
  -h, --help   Show this help message
`);
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

export async function runCommand(command: string[], cwd?: string): Promise<CommandResult> {
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

export async function checkBrewUpgrades() {
  const brew = Bun.which("brew") ?? "/opt/homebrew/bin/brew";
  const result = await runCommand([brew, "outdated", "--json=v2"]);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || "brew outdated failed");
  }

  const parsed = JSON.parse(result.stdout || "{}") as {
    formulae?: Array<{
      name?: string;
      installed_versions?: string[];
      current_version?: string;
    }>;
    casks?: Array<{
      name?: string;
      installed_versions?: string[];
      current_version?: string;
    }>;
  };

  const formulae = (parsed.formulae ?? []).flatMap((item) => {
    if (!item.name || !item.current_version) {
      return [];
    }

    return [{
      name: item.name,
      current: item.installed_versions?.[0] ?? "-",
      latest: item.current_version,
      kind: "formula" as const,
    }];
  });

  const casks = (parsed.casks ?? []).flatMap((item) => {
    if (!item.name || !item.current_version) {
      return [];
    }

    return [{
      name: item.name,
      current: item.installed_versions?.[0] ?? "-",
      latest: item.current_version,
      kind: "cask" as const,
    }];
  });

  return [...formulae, ...casks].sort((left, right) => left.name.localeCompare(right.name));
}

function parseBunfilePackages(content: string) {
  return content
    .split("\n")
    .map((line) => line.split("#", 1)[0]?.trim() ?? "")
    .filter(Boolean);
}

async function readInstalledGlobalVersion(name: string) {
  const path = resolve(process.env.HOME ?? "~", ".bun", "install", "global", "node_modules", name, "package.json");
  if (!(await pathExists(path))) {
    return null;
  }

  const parsed = JSON.parse(await readFile(path, "utf8")) as { version?: string };
  return parsed.version?.trim() ?? null;
}

async function fetchLatestPackageVersion(name: string) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`npm registry lookup failed for ${name} (${response.status})`);
  }

  const parsed = await response.json() as {
    "dist-tags"?: {
      latest?: string;
    };
  };
  const latest = parsed["dist-tags"]?.latest?.trim();
  if (!latest) {
    throw new Error(`Could not find latest version for ${name}`);
  }

  return latest;
}

export async function checkBunUpgrades(cwd: string) {
  const manifestPath = await findNearestManifest(cwd, "Bunfile");
  if (!manifestPath) {
    throw new Error(`Could not find Bunfile from ${cwd}`);
  }

  const packages = parseBunfilePackages(await readFile(manifestPath, "utf8"));
  const outdated: BunUpgrade[] = [];

  for (const name of packages) {
    const [current, latest] = await Promise.all([
      readInstalledGlobalVersion(name),
      fetchLatestPackageVersion(name),
    ]);

    if (!current || Bun.semver.order(current, latest) < 0) {
      outdated.push({
        name,
        current: current ?? "missing",
        latest,
      });
    }
  }

  return outdated.sort((left, right) => left.name.localeCompare(right.name));
}

function toPreviewItems(items: Array<BrewUpgrade | BunUpgrade>): UpgradePreviewItem[] {
  return items.map((item) => ({
    name: item.name,
    current: item.current,
    latest: item.latest,
  }));
}

function parseArgs(argv: string[]) {
  const args = new Set(argv);
  const brewOnly = args.has("--brew-only");
  const bunOnly = args.has("--bun-only");

  if (brewOnly && bunOnly) {
    throw new Error("Pass at most one of --brew-only or --bun-only.");
  }

  return {
    dryRun: args.has("--dry-run"),
    yes: args.has("--yes"),
    brewEnabled: !bunOnly,
    bunEnabled: !brewOnly,
  };
}

async function loadDependencies(overrides: Partial<UpgradeDependencies> = {}): Promise<UpgradeDependencies> {
  return {
    readTextFile: readFile,
    checkBrewUpgrades,
    checkBunUpgrades,
    confirmUpgrade,
    runCommand,
    ...overrides,
  };
}

export async function runUpgrade(argv: string[], options: RunUpgradeOptions = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp(stdout);
    return 0;
  }

  try {
    const { dryRun, yes, brewEnabled, bunEnabled } = parseArgs(argv);
    const cwd = options.cwd ?? process.cwd();
    const deps = await loadDependencies(options.deps);

    const brew = brewEnabled
      ? await withSpinnerTo("Checking Homebrew upgrades", stderr, () => deps.checkBrewUpgrades())
      : [];
    const bun = bunEnabled
      ? await withSpinnerTo("Checking Bun global packages", stderr, () => deps.checkBunUpgrades(cwd))
      : [];

    const preview: UpgradePreview = {
      brew: toPreviewItems(brew),
      bun: toPreviewItems(bun),
      brewEnabled,
      bunEnabled,
    };

    if (brew.length === 0 && bun.length === 0) {
      writeAppHeader(stdout, "Upgrade", "Review managed Homebrew and Bun upgrades before applying them.");
      writeSectionTo(stdout, "Upgrade");
      writeLine(stdout, "Nothing to upgrade.");
      return 0;
    }

    writeAppHeader(stdout, "Upgrade", "Review managed Homebrew and Bun upgrades before applying them.");
    writeSectionTo(stdout, "Upgrade");
    writePairTo(stdout, "homebrew", brewEnabled ? `${brew.length} outdated` : "disabled");
    writePairTo(stdout, "bun", bunEnabled ? `${bun.length} outdated` : "disabled");
    writeLine(stdout);

    if (dryRun) {
      if (brewEnabled) {
        writeSectionTo(stdout, "Homebrew");
        for (const item of brew) {
          writeBullet(stdout, `${item.name} ${item.current} -> ${item.latest}`);
        }
        writeLine(stdout);
      }

      if (bunEnabled) {
        writeSectionTo(stdout, "Bun");
        for (const item of bun) {
          writeBullet(stdout, `${item.name} ${item.current} -> ${item.latest}`);
        }
      }

      return 0;
    }

    if (!yes) {
      const confirmed = await deps.confirmUpgrade(preview);
      if (!confirmed) {
        writeLine(stderr, "Upgrade cancelled.");
        return 0;
      }
    }

    if (brew.length > 0) {
      await withSpinnerTo("Running brew upgrade", stderr, async () => {
        const brewBin = Bun.which("brew") ?? "/opt/homebrew/bin/brew";
        const result = await deps.runCommand([brewBin, "upgrade"], cwd);
        if (result.exitCode !== 0) {
          throw new Error(result.stderr || "brew upgrade failed");
        }
      });
    }

    if (bun.length > 0) {
      for (const item of bun) {
        await withSpinnerTo(`Upgrading bun package ${item.name}`, stderr, async () => {
          const result = await deps.runCommand(["bun", "install", "-g", item.name], cwd);
          if (result.exitCode !== 0) {
            throw new Error(result.stderr || `bun install -g ${item.name} failed`);
          }
        });
      }
    }

    writeSectionTo(stdout, "Upgraded");
    writePairTo(stdout, "homebrew", brewEnabled ? `${brew.length} package${brew.length === 1 ? "" : "s"}` : "disabled");
    writePairTo(stdout, "bun", bunEnabled ? `${bun.length} package${bun.length === 1 ? "" : "s"}` : "disabled");
    if (brew.length > 0) {
      writeBullet(stdout, `brew upgrade ran for ${brew.length} outdated package${brew.length === 1 ? "" : "s"}`, "success");
    }
    for (const item of bun) {
      writeBullet(stdout, `${item.name} -> ${item.latest}`, "success");
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeLine(stderr, message);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await runUpgrade(process.argv.slice(2)));
}
