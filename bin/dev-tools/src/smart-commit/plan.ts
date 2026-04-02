import { generateObject } from "ai";
import { z } from "zod";

import { MODELS, getOpenRouterProvider } from "../lib/llm.ts";
import type { GatheredContext } from "./gather.ts";
import { buildGroupingPrompt } from "./prompt.ts";

export const commitGroupSchema = z.object({
  id: z.string().min(1),
  files: z.array(z.string()).min(1),
  reason: z.string().min(1),
  draft_message: z.string().min(1),
});

export const commitPlanSchema = z.array(commitGroupSchema);
const commitPlanEnvelopeSchema = z.object({
  groups: commitPlanSchema,
});
const MAX_PLAN_ATTEMPTS = 3;
type CommitPlanRequestResult = {
  object: {
    groups: CommitGroup[];
  };
};

export type CommitGroup = z.infer<typeof commitGroupSchema>;

export function validateCommitPlan(context: GatheredContext, plan: CommitGroup[]) {
  const expected = new Set(context.files.map((file) => file.path));
  const seen = new Set<string>();

  for (const group of plan) {
    if (group.files.length === 0) {
      throw new Error(`Group ${group.id} is empty`);
    }

    for (const file of group.files) {
      if (!expected.has(file)) {
        throw new Error(`Plan referenced unknown file: ${file}`);
      }

      if (seen.has(file)) {
        throw new Error(`Plan referenced file more than once: ${file}`);
      }

      seen.add(file);
    }
  }

  const missing = [...expected].filter((file) => !seen.has(file));
  if (missing.length > 0) {
    throw new Error(`Plan omitted files: ${missing.join(", ")}`);
  }
}

async function requestCommitPlan(
  context: GatheredContext,
  correction?: string,
): Promise<CommitPlanRequestResult> {
  const openrouter = getOpenRouterProvider();
  return generateObject({
    model: openrouter(MODELS.analyzeAndGroup),
    schema: commitPlanEnvelopeSchema,
    schemaName: "commit_plan",
    schemaDescription: "A complete grouping of the scoped file set into atomic commits.",
    system: [
      "You are grouping git changes into atomic commits.",
      "Return a complete commit plan for the scoped files.",
      "Every scoped file must appear exactly once across the full plan.",
      "Do not invent files.",
      "Prefer small, coherent commits with clear reasons.",
      "Order dependencies first.",
      "Return an object with a single `groups` array field.",
      "draft_message must be a concise conventional-commit-style subject line.",
    ].join("\n"),
    prompt: [
      buildGroupingPrompt(context),
      correction
        ? [
          "",
          "Previous attempt failed validation.",
          `Validation error: ${correction}`,
          "Correct the plan so every scoped file appears exactly once.",
        ].join("\n")
        : "",
    ].filter(Boolean).join("\n"),
  });
}

export async function generateCommitPlan(
  context: GatheredContext,
  deps: {
    requestCommitPlan?: typeof requestCommitPlan;
  } = {},
) {
  const requestPlan = deps.requestCommitPlan ?? requestCommitPlan;
  let validationError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_PLAN_ATTEMPTS; attempt += 1) {
    const result = await requestPlan(context, validationError?.message);

    try {
      validateCommitPlan(context, result.object.groups);
      return result.object.groups;
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      validationError = error;
      if (attempt === MAX_PLAN_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw validationError ?? new Error("Failed to generate a valid commit plan.");
}
