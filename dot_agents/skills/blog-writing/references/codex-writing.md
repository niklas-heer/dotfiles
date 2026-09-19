# Optional Codex writing pass

Use the installed `openai-docs` skill when checking current Codex model or
authentication choices. Verify `codex login status` and `codex exec --help`.
As checked on 2026-09-19, ChatGPT sign-in provides subscription access for Codex;
API-key use has separate billing. Model availability is account-dependent.
See [authentication](https://learn.chatgpt.com/docs/auth) and
[models](https://learn.chatgpt.com/docs/models). Do not promise unlimited runs.

Do not assume that `--model opus` uses the ChatGPT subscription. Opus is not
listed among Codex's subscription models in those docs; using a different
provider requires separately verified access and billing. Preserve an explicit
model choice and explain an unavailable route rather than silently substituting.
For an unspecified model, use the user's already configured supported default;
add `--model` only after verifying availability. Do not change global defaults
or fall back to paid API credentials merely to complete a draft.

Niklas authorized Codex CLI drafting as part of this workflow. Prepare a sanitized, self-contained
brief and a new output path under ignored scratch space. Include exact factual
constraints, source excerpts, voice guidance, and the requested length. Tell the
writer to return only the article, use no tools, make no repository changes, and
neither publish nor delegate. Do not give it raw inventories or secret-bearing
logs. One draft and a focused revision are usually enough for an initial trial.

Example, with resolved absolute paths substituted:

```sh
rtk codex exec --ephemeral --sandbox read-only -C /absolute/hub \
  --output-last-message /absolute/hub/scratch/storytelling/candidate-draft.md \
  - < /absolute/hub/scratch/storytelling/candidate-brief.md
```

Use a fresh output path; check the exit status and output before accepting it.
The parent CLI saves the final message; the writer does not need workspace
write access. Read-only shell sandboxing does not itself disable connectors:
keep the task textual, and inspect execution logs for unexpected actions. On
auth, limits, or model errors, report the failure and retain the brief instead
of retrying indefinitely or switching billing. Do not invoke the storytelling
skill recursively from the writing prompt.

## Review the returned text

Check every factual claim against the brief and sources. Preserve benchmark
denominators, corrected labels, rejected samples, measurement scope, and the
difference between a prototype and integration. Do not add fabricated quotes,
metrics, screenshots, anecdotes, or claims that a command was reproduced.
Link useful primary evidence naturally. Editorial scores cannot verify facts.

Revise for voice and flow after fact checking. Keep evidence notes, unresolved
questions, model/run details, and readiness outside the article. A draft should
read as prose, not an evaluator report, while remaining honest about uncertainty.

The scratch output is an intermediate artifact. Continue the parent skill's
visual editing and local preview workflow; do not finish by delivering only the
CLI's Markdown. Do not invent backdated publication dates from commit dates.
