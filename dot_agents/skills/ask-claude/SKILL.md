---
name: ask-claude
description: Use Claude for writing, design feedback, or an independent second opinion through the installed Claude Code CLI and its subscription login. Use when the user asks to consult Claude or invokes this action from Codex, T3 Code, or Claude Code.
---

# Ask Claude

Turn the user's request into a focused Claude brief, obtain the response, and use
it to complete the requested work. Preserve the audience, voice, constraints,
and requested deliverable. Claude receives only the context you supply.

## Actions

The first word can select an action; infer it from ordinary language otherwise:

- `write`: draft or revise text, preserving supplied facts and voice examples.
- `design`: propose or critique layout, hierarchy, interaction, and visual style.
  Supply the actual screenshot for visual critique, or clearly limit the brief
  to the supplied description/code. Return actionable changes or requested code.
- `review`: get an independent critique of a draft, plan, or implementation.
  Supply the evidence and question without priming Claude with your conclusion.

Examples:

```text
$ask-claude write Make this introduction clearer while keeping my voice.
$ask-claude design Critique this screenshot's hierarchy and spacing.
$ask-claude review Find weaknesses in this implementation plan.
```

In Claude Code use `/ask-claude` with the same arguments. T3 Code supports skill
selection with `$`; current versions can also show skills in the slash menu.
Natural-language invocation works when the host discovers this skill. If an
older host does not list it, ask it to read `~/.agents/skills/ask-claude/SKILL.md`.

## Choose the execution path

When already running in Claude Code, perform the action in the current session.
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
  --tools '' --no-session-persistence --output-format json < /path/to/brief.txt
```

`--safe-mode` disables customizations while retaining normal authentication;
`--setting-sources ''` excludes user/project/local settings. Do not substitute
`--bare`: it skips subscription OAuth and keychain access and requires API or
provider credentials. Do not spoof a client, automate a terminal to disguise
headless usage, or repurpose subscription tokens as general API credentials.

For a supplied screenshot or necessary local file, replace `--tools ''` with
`--tools Read --allowedTools Read`, provide its absolute path in the brief, and
use `--add-dir` for its parent directory when needed. Request reading only the
named inputs. Keep shell, edit, browser, and MCP tools disabled. For ordinary
text, include the relevant contents in the brief and keep all tools disabled.
Do not claim Claude inspected an image if it only received a description.

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
[programmatic CLI use](https://code.claude.com/docs/en/headless) and
[credential rules](https://code.claude.com/docs/en/legal-and-compliance).
