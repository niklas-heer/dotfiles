import type { GatheredContext, ScopedFile } from "./gather.ts";
import type { PlannedCommitGroup } from "./groups.ts";

const PLAN_PROMPT_CHAR_BUDGET = 180_000;
const MESSAGE_PROMPT_CHAR_BUDGET = 220_000;
const SUMMARY_SNIPPET_LINES = 24;
const SUMMARY_SNIPPET_CHARS = 1_800;
const DETAILED_SNIPPET_LINES = 80;
const DETAILED_SNIPPET_CHARS = 6_000;
const RECENT_COMMIT_LIMIT = 6;
const RECENT_COMMIT_LINE_CHARS = 120;

type FilePromptVariants = {
  tiny: string;
  minimal: string;
  summary: string;
  detailed: string;
};

function trimChars(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 4))}...`;
}

function trimLines(value: string, maxLines: number) {
  const lines = value.split("\n");
  if (lines.length <= maxLines) {
    return value;
  }

  return `${lines.slice(0, maxLines).join("\n")}\n...`;
}

function trimSnippet(value: string, maxLines: number, maxChars: number) {
  return trimChars(trimLines(value, maxLines), maxChars).trim();
}

function renderRecentCommits(recentCommits: string[]) {
  if (recentCommits.length === 0) {
    return "(none)";
  }

  return recentCommits
    .slice(0, RECENT_COMMIT_LIMIT)
    .map((line) => trimChars(line, RECENT_COMMIT_LINE_CHARS))
    .join("\n");
}

function getPromptBody(file: ScopedFile) {
  if (file.binary) {
    return file.statSummary;
  }

  return file.representation === "full"
    ? file.fullDiff
    : file.representation === "trimmed"
      ? file.trimmedDiff
      : [file.statSummary, file.contentPreview].filter(Boolean).join("\n\n");
}

function renderFileHeader(file: ScopedFile) {
  const parts = [
    `path: ${file.path}`,
    `status: ${file.status}`,
    `source: ${file.source}`,
    `binary: ${file.binary}`,
  ];

  if (file.previousPath) {
    parts.push(`previous_path: ${file.previousPath}`);
  }

  return parts.join(" | ");
}

function renderFileVariant(file: ScopedFile, body: string | undefined) {
  if (!body) {
    return renderFileHeader(file);
  }

  return `${renderFileHeader(file)}\n${body}`;
}

function getFilePromptVariants(file: ScopedFile): FilePromptVariants {
  const tiny = renderFileHeader(file);
  const minimal = renderFileVariant(file, `summary: ${file.statSummary}`);
  const baseBody = getPromptBody(file);

  if (!baseBody || file.binary) {
    return {
      tiny,
      minimal,
      summary: minimal,
      detailed: minimal,
    };
  }

  const summarySnippet = trimSnippet(baseBody, SUMMARY_SNIPPET_LINES, SUMMARY_SNIPPET_CHARS);
  const detailedSnippet = trimSnippet(baseBody, DETAILED_SNIPPET_LINES, DETAILED_SNIPPET_CHARS);

  return {
    tiny,
    minimal,
    summary: renderFileVariant(file, [`summary: ${file.statSummary}`, "excerpt:", summarySnippet].join("\n")),
    detailed: renderFileVariant(file, [`summary: ${file.statSummary}`, "excerpt:", detailedSnippet].join("\n")),
  };
}

function upgradeEntries(
  chosen: string[],
  variants: FilePromptVariants[],
  target: "summary" | "detailed",
  budget: number,
  currentLength: number,
) {
  const indexes = variants
    .map((variant, index) => ({
      index,
      delta: variant[target].length - chosen[index]!.length,
    }))
    .filter((item) => item.delta > 0)
    .sort((left, right) => left.delta - right.delta);

  let total = currentLength;
  for (const item of indexes) {
    if (total + item.delta > budget) {
      continue;
    }

    chosen[item.index] = variants[item.index]![target];
    total += item.delta;
  }

  return total;
}

function downgradeEntries(
  chosen: string[],
  variants: FilePromptVariants[],
  fallback: "minimal" | "tiny",
  budget: number,
  currentLength: number,
) {
  const indexes = variants
    .map((variant, index) => ({
      index,
      delta: chosen[index]!.length - variant[fallback].length,
    }))
    .filter((item) => item.delta > 0)
    .sort((left, right) => right.delta - left.delta);

  let total = currentLength;
  for (const item of indexes) {
    if (total <= budget) {
      break;
    }

    chosen[item.index] = variants[item.index]![fallback];
    total -= item.delta;
  }

  return total;
}

function renderBudgetedFiles(files: ScopedFile[], budget: number) {
  const variants = files.map(getFilePromptVariants);
  const chosen = variants.map((variant) => variant.minimal);
  let total = chosen.reduce((sum, entry) => sum + entry.length, 0);

  total = upgradeEntries(chosen, variants, "summary", budget, total);
  total = upgradeEntries(chosen, variants, "detailed", budget, total);

  if (total > budget) {
    total = downgradeEntries(chosen, variants, "minimal", budget, total);
  }

  if (total > budget) {
    downgradeEntries(chosen, variants, "tiny", budget, total);
  }

  return chosen.join("\n\n");
}

function buildPromptSections(
  heading: string,
  executionMode: string,
  recentCommits: string[],
  files: ScopedFile[],
  budget: number,
) {
  const prefix = [
    `Execution mode: ${executionMode}`,
    "",
    "Recent commits:",
    renderRecentCommits(recentCommits),
    "",
    heading,
  ].join("\n");
  const remainingBudget = Math.max(20_000, budget - prefix.length);

  return `${prefix}\n${renderBudgetedFiles(files, remainingBudget)}`;
}

export function buildGroupingPrompt(context: GatheredContext) {
  return buildPromptSections(
    "Scoped files:",
    context.mode,
    context.recentCommits,
    context.files,
    PLAN_PROMPT_CHAR_BUDGET,
  );
}

export function buildMessagePrompt(context: GatheredContext, groups: PlannedCommitGroup[]) {
  const groupedFiles = groups.flatMap((group) => group.scopedFiles);
  const filesBlock = renderBudgetedFiles(groupedFiles, MESSAGE_PROMPT_CHAR_BUDGET);
  const groupBlock = groups.map((group) => [
    `GROUP ${group.id}`,
    `reason: ${group.reason}`,
    `draft_message: ${group.draft_message}`,
    "files:",
    ...group.files.map((file) => `- ${file}`),
  ].join("\n")).join("\n\n");

  return [
    `Execution mode: ${context.mode}`,
    "",
    "Recent commits for style reference:",
    renderRecentCommits(context.recentCommits),
    "",
    "Commit groups:",
    groupBlock,
    "",
    "Scoped file details:",
    filesBlock,
  ].join("\n");
}
