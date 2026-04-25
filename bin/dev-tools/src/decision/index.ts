import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { generateObject } from "ai";
import { z } from "zod";

import { MODELS, getOpenRouterProvider } from "../lib/llm.ts";
import { statusText, withSpinnerTo, writeAppHeader, writeBullet, writeCodeBlock, writeLine, writePairTo, writeSectionTo } from "../lib/ui.ts";
import { endDecisionSession, promptForApproval, promptForFollowUp, promptForNotes, type DecisionReviewData, withDecisionProgress } from "./prompt.tsx";

type DecisionStatusKind = "adopted" | "deprecated" | "supersedes";

type DecisionForm = {
  title: string;
  status: DecisionStatusKind;
  reference?: string;
  decision: string;
  context: string;
  consequences: string;
};

type DecisionQuestion = {
  kind: "question";
  question: string;
};

type DecisionDraftResponse = {
  kind: "draft";
  draft: DecisionForm;
};

type DecisionAssistantResponse = DecisionQuestion | DecisionDraftResponse;

type DecisionDependencies = {
  readTextFile: typeof readFile;
  writeTextFile: typeof writeFile;
  promptNotes: () => Promise<string | null>;
  promptFollowUp: (question: string) => Promise<string | null>;
  promptApproval: (review: DecisionReviewData) => Promise<boolean>;
  requestDecisionDraft: typeof requestDecisionDraft;
};

type RunDecisionOptions = {
  cwd?: string;
  stdout?: Pick<typeof process.stdout, "write">;
  stderr?: Pick<typeof process.stderr, "write">;
  deps?: Partial<DecisionDependencies>;
};

const decisionFormSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["adopted", "deprecated", "supersedes"]),
  reference: z.string().min(1).optional(),
  decision: z.string().min(1),
  context: z.string().min(1),
  consequences: z.string().min(1),
});

const decisionAssistantSchema = z.object({
  needs_follow_up: z.boolean(),
  question: z.string().nullable(),
  title: z.string().nullable(),
  status: z.enum(["adopted", "deprecated", "supersedes"]).nullable(),
  reference: z.string().nullable(),
  decision: z.string().nullable(),
  context: z.string().nullable(),
  consequences: z.string().nullable(),
});

const MAX_DRAFT_ATTEMPTS = 3;
const DECISION_LOG_START = "<!-- DECISION LOG START -->";
const DECISION_LOG_END = "<!-- DECISION LOG END -->";

function extractProviderErrorDetails(error: Error & {
  statusCode?: number;
  responseBody?: string;
}) {
  const details: string[] = [];

  if (typeof error.statusCode === "number") {
    details.push(`status ${error.statusCode}`);
  }

  if (error.responseBody) {
    try {
      const parsed = JSON.parse(error.responseBody) as {
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
      details.push(error.responseBody);
    }
  }

  return details;
}

function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const providerDetails = extractProviderErrorDetails(error as Error & {
      statusCode?: number;
      responseBody?: string;
    });
    const nested = "cause" in error ? formatErrorDetails((error as Error & { cause?: unknown }).cause) : "";
    const details = [
      error.message,
      ...providerDetails,
      nested && nested !== error.message ? nested : "",
    ].filter(Boolean);
    return [...new Set(details)].join(": ");
  }

  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const candidate = [
      record.message,
      record.error,
      record.responseBody,
      record.body,
    ].find((value) => typeof value === "string" && value.trim().length > 0);

    if (typeof candidate === "string") {
      return candidate;
    }

    try {
      return JSON.stringify(record);
    } catch {
      return String(error);
    }
  }

  return String(error);
}

function toDecisionAssistantResponse(result: z.infer<typeof decisionAssistantSchema>): DecisionAssistantResponse {
  if (result.needs_follow_up) {
    const question = result.question?.trim();
    if (!question) {
      throw new Error("Decision assistant requested a follow-up but did not provide a question.");
    }

    return {
      kind: "question",
      question,
    };
  }

  const draft = decisionFormSchema.parse({
    title: result.title ?? undefined,
    status: result.status ?? undefined,
    reference: result.reference ?? undefined,
    decision: result.decision ?? undefined,
    context: result.context ?? undefined,
    consequences: result.consequences ?? undefined,
  });

  return {
    kind: "draft",
    draft,
  };
}

function printHelp(stdout: Pick<typeof process.stdout, "write">) {
  stdout.write(`decision

Usage:
  bun run src/decision/index.ts [notes]

Options:
  -h, --help  Show this help message
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

async function findNearestReadme(startDir: string) {
  let current = resolve(startDir);

  while (true) {
    const candidate = join(current, "README.md");
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

function parseArgs(argv: string[]) {
  return {
    notes: argv.filter((arg) => !arg.startsWith("-")).join(" ").trim() || undefined,
  };
}

function cleanSentence(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDecisionForm(form: DecisionForm): DecisionForm {
  return {
    title: cleanSentence(form.title),
    status: form.status,
    reference: form.reference?.trim() || undefined,
    decision: cleanSentence(form.decision),
    context: cleanSentence(form.context),
    consequences: cleanSentence(form.consequences),
  };
}

export function getNextDecisionNumber(content: string) {
  const matches = [...content.matchAll(/^### (\d+) /gm)];
  const numbers = matches.map((match) => Number.parseInt(match[1]!, 10)).filter(Number.isFinite);
  return numbers.length === 0 ? 0 : Math.max(...numbers) + 1;
}

export function getDecisionTitles(content: string) {
  return [...content.matchAll(/^### \d+ (.+)$/gm)]
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

function renderStatusLine(status: DecisionStatusKind, reference?: string) {
  if (status === "adopted") {
    return "✅ Adopted";
  }

  if (!reference?.trim()) {
    throw new Error("A reference is required for deprecated or supersedes statuses.");
  }

  return status === "deprecated"
    ? `⛔ Deprecated by [${reference.trim()}]`
    : `⬆️ Supersedes [${reference.trim()}]`;
}

export function renderDecisionEntry(number: number, form: DecisionForm) {
  const normalized = normalizeDecisionForm(form);
  return [
    `### ${number} ${normalized.title}`,
    `* **Status**: ${renderStatusLine(normalized.status, normalized.reference)}`,
    `* **Decision**: ${normalized.decision}`,
    `* **Context**: ${normalized.context}`,
    `* **Consequences**: ${normalized.consequences}`,
  ].join("\n");
}

export function insertDecisionEntry(content: string, entry: string) {
  const startIndex = content.indexOf(DECISION_LOG_START);
  const endIndex = content.indexOf(DECISION_LOG_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("README.md is missing the decision log markers.");
  }

  const insertIndex = startIndex + DECISION_LOG_START.length;
  const before = content.slice(0, insertIndex);
  const after = content.slice(insertIndex);

  return `${before}\n\n${entry}\n${after.replace(/^\n*/, "\n")}`;
}

export async function requestDecisionDraft({
  notes,
  existingDecisionTitles,
  followUps,
}: {
  notes: string;
  existingDecisionTitles: string[];
  followUps: Array<{ question: string; answer: string }>;
}): Promise<DecisionAssistantResponse> {
  const openrouter = getOpenRouterProvider();
  try {
    const result = await generateObject({
      model: openrouter(MODELS.writeDecision),
      schema: decisionAssistantSchema,
      schemaName: "decision_assistant_response",
      schemaDescription: "A response that either asks for one more detail or returns a full decision draft.",
      system: [
        "You turn rough developer notes into polished decision log entries for a dotfiles repository.",
        "Return a single object.",
        "Set `needs_follow_up` to true only if one short question is required to draft a good decision entry.",
        "Every key must always be present in the returned object.",
        "Use null for fields that are not applicable in the current branch.",
        "If `needs_follow_up` is true, fill `question` and set `title`, `status`, `reference`, `decision`, `context`, and `consequences` to null.",
        "If `needs_follow_up` is false, fill `title`, `status`, `decision`, `context`, and `consequences` and set `question` to null.",
        "Default to `adopted` unless the notes clearly describe replacing or deprecating another decision.",
        "If status is `deprecated` or `supersedes`, include the referenced prior decision in `reference`; otherwise set `reference` to null.",
        "Write in first person singular.",
        "Keep title concise and decision-oriented.",
        "Write `decision`, `context`, and `consequences` as polished prose, each one to three sentences.",
        "Do not use markdown headings or bullets inside the fields.",
        "Do not mention that an AI wrote the content.",
      ].join("\n"),
      prompt: [
        "Current decision titles:",
        existingDecisionTitles.length > 0 ? existingDecisionTitles.map((title) => `- ${title}`).join("\n") : "- none",
        "",
        "Rough notes:",
        notes,
        followUps.length > 0
          ? [
            "",
            "Follow-up answers:",
            followUps.map(({ question, answer }) => `Q: ${question}\nA: ${answer}`).join("\n\n"),
          ].join("\n")
          : "",
      ].filter(Boolean).join("\n"),
    });

    return toDecisionAssistantResponse(result.object);
  } catch (error) {
    const details = formatErrorDetails(error);
    throw new Error(`Decision drafting failed${details ? `: ${details}` : ""}`);
  }
}

async function loadDependencies(overrides: Partial<DecisionDependencies> = {}): Promise<DecisionDependencies> {
  return {
    readTextFile: readFile,
    writeTextFile: writeFile,
    promptNotes: promptForNotes,
    promptFollowUp: promptForFollowUp,
    promptApproval: promptForApproval,
    requestDecisionDraft,
    ...overrides,
  };
}

function printDraft(
  stdout: Pick<typeof process.stdout, "write">,
  form: DecisionForm,
  number: number,
  notes: string,
) {
  writeAppHeader(stdout, "Decision", "Draft a decision log entry from rough notes and confirm before writing.");
  writeSectionTo(stdout, "Decision Draft");
  writePairTo(stdout, "number", String(number));
  writePairTo(stdout, "title", form.title);
  writePairTo(stdout, "status", renderStatusLine(form.status, form.reference));
  writeLine(stdout);
  writeCodeBlock(stdout, renderDecisionEntry(number, form));
  writeLine(stdout);
  writeSectionTo(stdout, "Source Notes");
  writeCodeBlock(stdout, notes);
  writeLine(stdout);
}

export async function runDecision(argv: string[], options: RunDecisionOptions = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp(stdout);
    return 0;
  }

  try {
    const deps = await loadDependencies(options.deps);
    const cwd = options.cwd ?? process.cwd();
    const readmePath = await findNearestReadme(cwd);

    if (!readmePath) {
      throw new Error(`Could not find README.md from ${cwd}`);
    }

    const { notes: initialNotes } = parseArgs(argv);
    const notes = initialNotes ?? await deps.promptNotes();
    if (!notes) {
      return 0;
    }

    const content = await deps.readTextFile(readmePath, "utf8");
    const existingDecisionTitles = getDecisionTitles(content);
    const followUps: Array<{ question: string; answer: string }> = [];

    let form: DecisionForm | null = null;

    for (let attempt = 1; attempt <= MAX_DRAFT_ATTEMPTS; attempt += 1) {
      const requestDraft = () => deps.requestDecisionDraft({
        notes,
        existingDecisionTitles,
        followUps,
      });
      const response = stdout === process.stdout && stderr === process.stderr
        ? await withDecisionProgress("Drafting decision", requestDraft)
        : await withSpinnerTo("Drafting decision", stderr, requestDraft);
      if (response.kind === "draft") {
        form = normalizeDecisionForm(response.draft);
        break;
      }

      const answer = await deps.promptFollowUp(response.question);
      if (!answer) {
        return 0;
      }

      followUps.push({
        question: response.question,
        answer,
      });
    }

    if (!form) {
      throw new Error("Could not draft a decision after multiple attempts.");
    }

    const number = getNextDecisionNumber(content);
    const entry = renderDecisionEntry(number, form);
    const review: DecisionReviewData = {
      number,
      title: form.title,
      statusLabel: renderStatusLine(form.status, form.reference),
      decision: form.decision,
      context: form.context,
      consequences: form.consequences,
      notes,
      followUps,
    };

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      printDraft(stdout, form, number, notes);
    }

    const approved = await deps.promptApproval(review);
    if (!approved) {
      writeLine(stderr, "Decision not written.");
      return 0;
    }

    const nextContent = insertDecisionEntry(content, entry);
    await deps.writeTextFile(readmePath, nextContent, "utf8");

    writeSectionTo(stdout, "Decision Added");
    writePairTo(stdout, "path", readmePath);
    writePairTo(stdout, "title", form.title);
    writeBullet(stdout, statusText("README updated", "success"));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${message}\n`);
    return 1;
  } finally {
    endDecisionSession();
  }
}

if (import.meta.main) {
  const exitCode = await runDecision(process.argv.slice(2));
  process.exit(exitCode);
}
