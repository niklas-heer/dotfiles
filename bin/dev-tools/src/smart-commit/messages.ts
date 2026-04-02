import { generateObject } from "ai";
import { z } from "zod";

import { MODELS, getOpenRouterProvider } from "../lib/llm.ts";
import type { GatheredContext } from "./gather.ts";
import type { PlannedCommitGroup } from "./groups.ts";
import { buildMessagePrompt } from "./prompt.ts";

const commitMessageSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().trim().optional(),
});

const commitMessagesSchema = z.array(commitMessageSchema);
const commitMessagesEnvelopeSchema = z.object({
  messages: commitMessagesSchema,
});
const CONVENTIONAL_TYPES = new Set([
  "feat",
  "fix",
  "docs",
  "refactor",
  "chore",
  "test",
  "style",
  "perf",
  "ci",
  "build",
]);
const GITMOJI_BY_TYPE: Record<string, string> = {
  feat: "✨",
  fix: "🐛",
  docs: "📝",
  refactor: "♻️",
  chore: "🔧",
  test: "✅",
  style: "💄",
  perf: "⚡️",
  ci: "👷",
  build: "📦",
};
const CONVENTIONAL_SUBJECT_PATTERN = /^(?<type>[a-z]+)(?<scope>\([^)]+\))?: (?<description>.+)$/u;
const LEADING_EMOJI_PATTERN = /^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u;

export type CommitMessage = z.infer<typeof commitMessageSchema>;

function parseConventionalSubject(subject: string) {
  const match = subject.trim().match(CONVENTIONAL_SUBJECT_PATTERN);
  if (!match?.groups) {
    throw new Error(`Message subject is not a conventional commit: ${subject}`);
  }

  const { type, scope, description } = match.groups;
  if (!CONVENTIONAL_TYPES.has(type)) {
    throw new Error(`Message subject uses an unsupported conventional commit type: ${type}`);
  }

  return {
    type,
    scope: scope ?? "",
    description: description.trim(),
  };
}

export function normalizeCommitSubject(subject: string) {
  const parsed = parseConventionalSubject(subject);
  const emoji = GITMOJI_BY_TYPE[parsed.type] ?? "🔧";
  const description = parsed.description.replace(LEADING_EMOJI_PATTERN, "").trim();

  if (!description) {
    throw new Error(`Message subject is missing a description: ${subject}`);
  }

  return `${parsed.type}${parsed.scope}: ${emoji} ${description}`;
}

export function normalizeCommitMessages(messages: CommitMessage[]) {
  return messages.map((message) => ({
    ...message,
    subject: normalizeCommitSubject(message.subject),
  }));
}

export function validateMessages(groups: PlannedCommitGroup[], messages: CommitMessage[]) {
  const expected = new Set(groups.map((group) => group.id));
  const seen = new Set<string>();

  for (const message of messages) {
    if (!expected.has(message.id)) {
      throw new Error(`Message referenced unknown group: ${message.id}`);
    }

    if (seen.has(message.id)) {
      throw new Error(`Message referenced group more than once: ${message.id}`);
    }

    seen.add(message.id);
    parseConventionalSubject(message.subject);
  }

  const missing = [...expected].filter((id) => !seen.has(id));
  if (missing.length > 0) {
    throw new Error(`Messages omitted groups: ${missing.join(", ")}`);
  }
}

export async function generateCommitMessages(
  context: GatheredContext,
  groups: PlannedCommitGroup[],
): Promise<CommitMessage[]> {
  const openrouter = getOpenRouterProvider();
  const result = await generateObject({
    model: openrouter(MODELS.writeMessages),
    schema: commitMessagesEnvelopeSchema,
    schemaName: "commit_messages",
    schemaDescription: "Commit messages for the generated commit plan.",
    system: [
      "Write git commit messages for grouped changes.",
      "Use conventional commits with an optional scope.",
      "Valid types: feat, fix, docs, refactor, chore, test, style, perf, ci, build.",
      "Format every subject as `type(scope): gitmoji description` or `type: gitmoji description`.",
      "Place the gitmoji after the conventional-commit prefix, never before it.",
      "Keep the subject concise and imperative.",
      "Use a body only when it adds real context.",
      "Return an object with a single `messages` array field.",
      "Return exactly one message object for each group id.",
    ].join("\n"),
    prompt: buildMessagePrompt(context, groups),
  });

  const messages = normalizeCommitMessages(result.object.messages);
  validateMessages(groups, messages);
  return messages;
}
