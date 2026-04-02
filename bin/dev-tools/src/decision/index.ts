import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { generateObject } from "ai";
import { z } from "zod";

import { MODELS, getOpenRouterProvider } from "../lib/llm.ts";
import { promptForApproval, promptForFollowUp, promptForNotes } from "./prompt.ts";

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
  promptApproval: () => Promise<boolean>;
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
  question: z.string().optional(),
  title: z.string().optional(),
  status: z.enum(["adopted", "deprecated", "supersedes"]).optional(),
  reference: z.string().optional(),
  decision: z.string().optional(),
  context: z.string().optional(),
  consequences: z.string().optional(),
});

const RESET = "\u001b[0m";
const DIM = "\u001b[2m";
const CYAN = "\u001b[36m";
const GREEN = "\u001b[32m";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const MAX_DRAFT_ATTEMPTS = 3;
const DECISION_LOG_START = "<!-- DECISION LOG START -->";
const DECISION_LOG_END = "<!-- DECISION LOG END -->";
const ANSI_CLEAR_LINE = "\u001b[2K";

function colorize(color: string, value: string) {
  return `${color}${value}${RESET}`;
}

function dim(value: string) {
  return colorize(DIM, value);
}

function writeLine(output: Pick<typeof process.stdout, "write"> | Pick<typeof process.stderr, "write">, message = "") {
  output.write(`${message}\n`);
}

function writeSection(output: Pick<typeof process.stdout, "write">, title: string) {
  writeLine(output, colorize(CYAN, title));
}

function writePair(output: Pick<typeof process.stdout, "write">, label: string, value: string) {
  writeLine(output, `${dim(label)} ${value}`);
}

function clearStatusLine(output: Pick<typeof process.stderr, "write">) {
  output.write(`\r${ANSI_CLEAR_LINE}`);
}

function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const nested = "cause" in error ? formatErrorDetails((error as Error & { cause?: unknown }).cause) : "";
    const details = [
      error.message,
      nested && nested !== error.message ? nested : "",
    ].filter(Boolean);
    return details.join(": ");
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
    title: result.title,
    status: result.status,
    reference: result.reference,
    decision: result.decision,
    context: result.context,
    consequences: result.consequences,
  });

  return {
    kind: "draft",
    draft,
  };
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
    clearStatusLine(process.stderr);
    process.stderr.write(colorize(CYAN, `${frame} ${label}`));
  };

  renderFrame();
  const interval = setInterval(renderFrame, 80);

  try {
    const result = await task();
    clearInterval(interval);
    clearStatusLine(process.stderr);
    process.stderr.write(`${colorize(GREEN, `✓ ${label}`)}\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    clearStatusLine(process.stderr);
    process.stderr.write(`${label}\n`);
    throw error;
  }
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
        "If `needs_follow_up` is true, fill only `question`.",
        "If `needs_follow_up` is false, fill `title`, `status`, `decision`, `context`, and `consequences`.",
        "Default to `adopted` unless the notes clearly describe replacing or deprecating another decision.",
        "If status is `deprecated` or `supersedes`, include the referenced prior decision in `reference`.",
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
  writeSection(stdout, "Decision Draft");
  writePair(stdout, "number", String(number));
  writePair(stdout, "title", form.title);
  writePair(stdout, "status", renderStatusLine(form.status, form.reference));
  writeLine(stdout);
  writeLine(stdout, renderDecisionEntry(number, form));
  writeLine(stdout);
  writeSection(stdout, "Source Notes");
  writeLine(stdout, notes);
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
      const response = await withStepSpinner("Drafting decision", stderr, () =>
        deps.requestDecisionDraft({
          notes,
          existingDecisionTitles,
          followUps,
        })
      );

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

    printDraft(stdout, form, number, notes);

    const approved = await deps.promptApproval();
    if (!approved) {
      writeLine(stderr, "Decision not written.");
      return 0;
    }

    const nextContent = insertDecisionEntry(content, entry);
    await deps.writeTextFile(readmePath, nextContent, "utf8");

    writeSection(stdout, "Decision Added");
    writePair(stdout, "path", readmePath);
    writePair(stdout, "title", form.title);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${message}\n`);
    return 1;
  }
}

if (import.meta.main) {
  const exitCode = await runDecision(process.argv.slice(2));
  process.exit(exitCode);
}
