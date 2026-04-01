import { gatherContext } from "./gather.ts";
import {
  formatIndentedBlock,
  info,
  note,
  renderCountLabel,
  section,
  warn,
  withSpinner,
} from "../lib/ui.ts";
import { materializeCommitGroups } from "./groups.ts";
import type { GatheredContext } from "./gather.ts";
import {
  isPathCoveredByIgnoreSuggestion,
  summarizeIgnoreCandidates,
} from "./advice.ts";

type SmartCommitDependencies = {
  generateCommitPlan: typeof import("./plan.ts").generateCommitPlan;
  generateCommitMessages: typeof import("./messages.ts").generateCommitMessages;
  reviewCommitGroups: typeof import("./review.tsx").reviewCommitGroups;
  executeCommitGroups: typeof import("./execute.ts").executeCommitGroups;
  CommitExecutionError: typeof import("./execute.ts").CommitExecutionError;
};

type RunSmartCommitOptions = {
  cwd?: string;
  deps?: Partial<SmartCommitDependencies>;
};

const MAX_PRINTED_FILES = 40;
const LARGE_IGNORE_CANDIDATE_COUNT = 200;

function printHelp() {
  console.log(`smart-commit

Usage:
  bun run src/smart-commit/index.ts [--dry-run]

Options:
  --dry-run   Run planning and review only
  -h, --help  Show this help message`);
}

function formatProviderError(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const maybeApiError = error as Error & {
    statusCode?: number;
    responseBody?: string;
  };

  const details: string[] = [];
  if (typeof maybeApiError.statusCode === "number") {
    details.push(`status ${maybeApiError.statusCode}`);
  }

  if (maybeApiError.responseBody) {
    try {
      const parsed = JSON.parse(maybeApiError.responseBody) as {
        error?: {
          message?: string;
          metadata?: {
            raw?: string;
          };
        };
      };

      const raw = parsed.error?.metadata?.raw;
      if (raw) {
        try {
          const nested = JSON.parse(raw) as {
            error?: {
              message?: string;
            };
          };
          if (nested.error?.message) {
            details.push(nested.error.message);
          }
        } catch {
          details.push(raw);
        }
      } else if (parsed.error?.message) {
        details.push(parsed.error.message);
      }
    } catch {
      details.push(maybeApiError.responseBody);
    }
  }

  if (details.length === 0) {
    return error.message;
  }

  return `${error.message} (${details.join("; ")})`;
}

async function loadDependencies(overrides: Partial<SmartCommitDependencies> = {}): Promise<SmartCommitDependencies> {
  const { generateCommitPlan } = await import("./plan.ts");
  const { generateCommitMessages } = await import("./messages.ts");
  const { reviewCommitGroups } = await import("./review.tsx");
  const { CommitExecutionError, executeCommitGroups } = await import("./execute.ts");

  return {
    generateCommitPlan,
    generateCommitMessages,
    reviewCommitGroups,
    executeCommitGroups,
    CommitExecutionError,
    ...overrides,
  };
}

function summarizeContext(context: GatheredContext) {
  const counts = {
    added: 0,
    modified: 0,
    deleted: 0,
    renamed: 0,
    untracked: 0,
    binary: 0,
  };

  for (const file of context.files) {
    if (file.status === "A") counts.added += 1;
    if (file.status === "M") counts.modified += 1;
    if (file.status === "D") counts.deleted += 1;
    if (file.status === "R") counts.renamed += 1;
    if (file.untracked) counts.untracked += 1;
    if (file.binary) counts.binary += 1;
  }

  return counts;
}

function describeMode(context: GatheredContext) {
  if (context.mode === "staged") {
    return "Using the staged snapshot only. Unstaged and untracked files are ignored unless they are already staged.";
  }

  return "Using the worktree state. Modified tracked files and untracked files are included together.";
}

function printContextSummary(context: GatheredContext) {
  const counts = summarizeContext(context);
  const ignoreCandidates = summarizeIgnoreCandidates(context.files);
  const suppressedSuggestions = new Set(ignoreCandidates.map((candidate) => candidate.suggestion));
  const visibleFiles = context.files.filter((file) =>
    ![...suppressedSuggestions].some((suggestion) => isPathCoveredByIgnoreSuggestion(file.path, suggestion))
  );

  section("Scope");
  info(`Mode: ${context.mode}`);
  note(`Repo: ${context.repoRoot}`);
  note(describeMode(context));
  note([
    renderCountLabel(context.files.length, "scoped file"),
    renderCountLabel(counts.modified, "modified file"),
    renderCountLabel(counts.added, "added file"),
    renderCountLabel(counts.deleted, "deleted file"),
    renderCountLabel(counts.renamed, "renamed file"),
    renderCountLabel(counts.untracked, "untracked file"),
  ].join(" | "));

  if (ignoreCandidates.length > 0) {
    section("Advice");
    warn("Some untracked files look like generated or local-only artifacts.");
    note("Consider adding them to .gitignore. In this chezmoi repo, local-only artifacts may also belong in .chezmoiignore.");
    for (const candidate of ignoreCandidates) {
      const exampleSuffix = candidate.examples.length > 0
        ? `; e.g. ${candidate.examples.join(", ")}`
        : "";
      console.log(`- ${candidate.suggestion} (${renderCountLabel(candidate.count, "untracked file")}${exampleSuffix})`);
    }
  }

  section("Changes");
  for (const file of visibleFiles.slice(0, MAX_PRINTED_FILES)) {
    const rename = file.previousPath ? ` <- ${file.previousPath}` : "";
    const kind = file.binary ? "binary" : "text";
    const untracked = file.untracked ? ", untracked" : "";
    console.log(`- [${file.status}] ${file.path}${rename} (${file.source}, ${kind}${untracked}, ${file.representation})`);
    console.log(formatIndentedBlock(file.statSummary));
  }

  const suppressedCount = context.files.length - visibleFiles.length;
  if (suppressedCount > 0) {
    note(`Suppressed ${renderCountLabel(suppressedCount, "likely-ignore file")} from the detailed list.`);
  }

  if (visibleFiles.length > MAX_PRINTED_FILES) {
    note(`... ${renderCountLabel(visibleFiles.length - MAX_PRINTED_FILES, "additional scoped file")} not shown`);
  }
}

function shouldAbortForIgnoreCandidates(context: GatheredContext) {
  if (context.mode !== "worktree") {
    return false;
  }

  const ignoreCandidateCount = summarizeIgnoreCandidates(context.files)
    .reduce((sum, candidate) => sum + candidate.count, 0);

  return ignoreCandidateCount >= LARGE_IGNORE_CANDIDATE_COUNT;
}

function printApprovedSummary(reviewedGroups: Awaited<ReturnType<SmartCommitDependencies["reviewCommitGroups"]>>) {
  if (reviewedGroups.status !== "approved") {
    return;
  }

  section("Approved");
  info(`Ready to create ${renderCountLabel(reviewedGroups.groups.length, "commit")}`);
  if (reviewedGroups.skippedCount > 0) {
    note(`Skipped ${renderCountLabel(reviewedGroups.skippedCount, "group")}`);
  }

  for (const [index, group] of reviewedGroups.groups.entries()) {
    console.log(`${index + 1}. ${group.message.subject}`);
    console.log(formatIndentedBlock(group.reason));
    console.log(formatIndentedBlock(group.files.join("\n")));
  }
}

export async function runSmartCommit(
  argv: string[],
  options: RunSmartCommitOptions = {},
) {
  const args = new Set(argv);

  if (args.has("-h") || args.has("--help")) {
    printHelp();
    return 0;
  }

  const cwd = options.cwd ?? process.cwd();
  const context = await withSpinner("Scanning repository state", () => gatherContext(cwd));
  if (!context) {
    info("Nothing to commit");
    return 0;
  }

  printContextSummary(context);

  if (shouldAbortForIgnoreCandidates(context)) {
    warn("Aborting before the LLM step because the worktree contains a large generated/untracked candidate set.");
    note("Add the generated paths to .gitignore, then rerun smart-commit.");
    return 1;
  }

  try {
    const deps = await loadDependencies(options.deps);

    const plan = await withSpinner("Generating commit plan", () => deps.generateCommitPlan(context));
    const groups = materializeCommitGroups(context, plan);
    const messages = await withSpinner("Writing commit messages", () => deps.generateCommitMessages(context, groups));
    const messagesById = new Map(messages.map((message) => [message.id, message]));
    const reviewedGroups = await deps.reviewCommitGroups(
      groups.map((group) => ({
        ...group,
        message: messagesById.get(group.id) ?? {
          id: group.id,
          subject: group.draft_message,
        },
      })),
    );

    if (reviewedGroups.status === "quit") {
      warn("Review cancelled.");
      return 0;
    }

    if (reviewedGroups.status === "skipped-all") {
      warn("All commit groups were skipped.");
      return 0;
    }

    printApprovedSummary(reviewedGroups);

    if (args.has("--dry-run")) {
      note("Dry-run stops after review.");
      return 0;
    }

    try {
      const result = await withSpinner("Creating commits", () => deps.executeCommitGroups(context, reviewedGroups.groups));

      section("Result");
      info(`Created ${renderCountLabel(result.createdCommits.length, "commit")}`);
      for (const commit of result.createdCommits) {
        console.log(`- ${commit.subject}`);
        console.log(formatIndentedBlock(`group ${commit.groupId}`));
      }
    } catch (error) {
      if (error instanceof deps.CommitExecutionError) {
        if (error.createdCommits.length > 0) {
          section("Partial Result");
          warn("Execution stopped after partial success.");
          for (const commit of error.createdCommits) {
            console.log(`- ${commit.subject}`);
            console.log(formatIndentedBlock(`group ${commit.groupId}`));
          }
        }

        throw new Error(`Commit execution failed: ${error.message}`);
      }

      throw error;
    }
  } catch (error) {
    const message = formatProviderError(error);
    warn(`smart-commit failed: ${message}`);
    return 1;
  }

  return 0;
}

if (import.meta.main) {
  process.exit(await runSmartCommit(process.argv.slice(2)));
}
