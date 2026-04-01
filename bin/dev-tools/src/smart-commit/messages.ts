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

export type CommitMessage = z.infer<typeof commitMessageSchema>;

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
      "Keep the subject concise and imperative.",
      "Use a body only when it adds real context.",
      "Return an object with a single `messages` array field.",
      "Return exactly one message object for each group id.",
    ].join("\n"),
    prompt: buildMessagePrompt(context, groups),
  });

  validateMessages(groups, result.object.messages);
  return result.object.messages;
}
