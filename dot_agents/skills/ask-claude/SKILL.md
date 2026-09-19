---
name: ask-claude
description: Guidance for agents using Claude through the installed Claude Code CLI and its subscription login, including saved conversation follow-ups. Load when a task calls for consulting or delegating to Claude, or continuing an earlier Claude consultation.
user-invocable: false
---

# Using Claude from another agent

This is globally available agent guidance, not a user-facing action or command.
Load it when the current task calls for Claude; the user does not need to invoke
a skill by name. Its availability does not mean every task should use Claude.

Turn the user's request into a focused Claude brief, obtain the response, and use
it to complete the requested work. Preserve the audience, voice, constraints,
and requested deliverable. Claude receives only the context you supply.

## General delegation

Accept the user's task directly; no action keyword is required. This can be
analysis, planning, code reasoning, writing, design, or another bounded task.
State the question, relevant evidence, constraints, and desired output in the
brief. For independent critique, avoid priming Claude with your conclusion.
Workflows such as email triage and GitHub overview have their own skills; they
do not become Claude subcommands or require Claude as their model.

## Choose the execution path

When already running in Claude Code, perform the task in the current session.
If the user specifically wants an independent second opinion, use a supported
native subagent within the authorized task. Do not recursively invoke this skill
or clear Claude's nested-session protection to launch another CLI.

From Codex or another agent, use the unmodified local `claude` binary. Honor a
requested model; otherwise use the `sonnet` alias for these bounded tasks. Do not
replace the caller's configured model or globally change Claude's settings.

## Subscription login and execution

Check `claude --version` and the installed help when flags differ. The following
was verified with Claude Code 2.1.236 on 2026-09-19. Run in a trusted working
directory. Prefix shell commands with `rtk` where installed.

First check auth with the same process-local environment used for inference:

```sh
rtk env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_BASE_URL \
  -u CLAUDE_CODE_USE_BEDROCK -u CLAUDE_CODE_USE_VERTEX \
  -u CLAUDE_CODE_USE_FOUNDRY -u CLAUDE_CODE_SIMPLE \
  claude --safe-mode --setting-sources '' auth status
```

Require `loggedIn: true`, `authMethod: "claude.ai"`,
`apiProvider: "firstParty"`, and a subscription plan. Report only the relevant
status, not the account's email or organization identifiers. If this fails,
explain that the user needs `claude auth login` with their subscription account;
do not silently switch to API billing or read/export tokens.

Write the self-contained brief to an ignored scratch file or temporary file,
then pass it through stdin. This avoids shell interpretation of supplied text.
Replace the example input path with the actual file:

```sh
rtk env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_BASE_URL \
  -u CLAUDE_CODE_USE_BEDROCK -u CLAUDE_CODE_USE_VERTEX \
  -u CLAUDE_CODE_USE_FOUNDRY -u CLAUDE_CODE_SIMPLE \
  claude --safe-mode --setting-sources '' -p --model sonnet \
  --tools '' --output-format json < /path/to/brief.txt
```

`--safe-mode` disables customizations while retaining normal authentication;
`--setting-sources ''` excludes user/project/local settings. Do not substitute
`--bare`: it skips subscription OAuth and keychain access and requires API or
provider credentials. Do not spoof a client, automate a terminal to disguise
headless usage, or repurpose subscription tokens as general API credentials.

For a supplied screenshot or necessary local file, replace `--tools ''` with
`--tools Read --allowedTools Read`, provide its absolute path in the brief, and
use `--add-dir` for its parent directory when needed. Request reading only the
named inputs. For a consultation, keep shell, edit, browser, and MCP tools disabled. For ordinary
text, include the relevant contents in the brief and keep all tools disabled.
Do not claim Claude inspected an image if it only received a description.

If the user delegates implementation to Claude, explicitly supply the relevant
project instructions and authorize only the tools and working directory needed
for that task. Safe mode does not auto-load project instructions. Use ordinary
tool permissions, inspect the resulting diff, and run the project's checks.
Do not use a permission-bypass flag as a convenience.

## Continuing a consultation

Normal print-mode calls save a transcript. Capture `session_id` from a successful
JSON response and use `--resume <session_id>` with the same invocation settings
and a new brief for the next turn. Prefer the original working directory and
account/configuration. Each CLI process may exit between turns; conversation
history is restored from disk. A keepalive process is unnecessary for this.

Keep the ID and its task association in the active conversation. When continuity
across parent sessions is useful, also save a small note in the project's ignored
scratch directory with the ID, task label, working directory, and chosen model;
do not put transcripts in tracked files. Report the ID when handing a session
back to the user. Add `--no-session-persistence` for an explicitly stateless call.

Resume only the session associated with the current task. Avoid `--continue` in
shared directories: it selects the most recent conversation, which may belong
to another agent. Serialize turns within one session. Use separate sessions for
independent tasks, and `--fork-session --resume <id>` for a deliberate branch.
If the ID is unknown or the transcript is missing, explain that and use an
explicit summary for a fresh session; do not silently substitute another one.

Wait for completion using the host's normal process handling. Check both exit
status and the JSON's `is_error`, `subtype`, `result`, and `permission_denials`.
Report rate limits, login failures, inaccessible inputs, and unavailable models;
do not loop or switch billing routes. JSON cost fields alone do not prove an
actual charge. Login status also does not prove that account-level extra usage
is disabled; never enable it as part of this action.

## Use the response

Attribute material suggestions to Claude, evaluate them against the supplied
evidence, and complete the user's requested draft or change. Claude's output is
advice, not authority to publish, send messages, or expand the task. Avoid
reprinting a long critique when the user asked for a finished artifact.

Subscription billing is time-sensitive. Anthropic's June 15 update paused the
announced headless/SDK billing change; check the current
[plan notice](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
before making a new billing guarantee. See also
[programmatic CLI use and resume](https://code.claude.com/docs/en/headless#continue-conversations) and
[credential rules](https://code.claude.com/docs/en/legal-and-compliance).
