---
name: latchrun
description: Run local commands that need credentials through a Latchrun session, so secrets resolve once instead of prompting the password manager on every command. Use when a repository's own instructions adopt Latchrun, or when repeated local commands need 1Password, password-store or file-backed credentials.
---

# Running credentialed commands with Latchrun

Latchrun resolves declared credentials from a provider, caches them in memory for a bounded time, and runs approved commands with those values in their environment. Its purpose here is to stop a password manager from prompting on every command in a work session.

Adopt it when the repository being worked in says so. A repository that declares no Latchrun profile is not covered by this skill; run its commands normally.

## Command policy is exact

A profile lists complete commands. The canonical absolute executable and **every argument** must match one rule. There is no prefix matching, no wildcard, and no implicit shell evaluation. Configuring a shell does not authorize arbitrary scripts: with `--shell SCRIPT`, the whole script is one argument that must also match a rule.

A command outside the allowlist fails with `policy_denied` and exit status 1. That is expected, not a malfunction. Widen the profile rather than working around it.

## Start a session once per work session

```sh
latchrun service start
latchrun session start <name> --profile <path>
latchrun run <name> --operation <id> -- /absolute/executable ARG ...
```

Use one session per project and name it after the repository directory, so a later step can find an existing session instead of starting a duplicate. Check first with `latchrun session status <name>`; start a new session only when none is active. Sessions expire after `ttl_seconds`, one hour by default.

Every deliberate execution needs a fresh operation ID. Reusing one fails with `duplicate_operation`. Omitting `--operation` generates an ID and prints it on stderr before submission; prefer that over inventing a scheme.

## Widen the allowlist when a command is denied

Editing a profile does not affect a running session, and `session resume` on an active session fails with `session_active`. The loop is:

```sh
latchrun session stop <name>
# add the complete command to "commands" in the profile
latchrun session resume <name> --profile <path>
```

Resume keeps the session ID, its operation history and its used-ID reservations. It clears cached credentials, so the provider is consulted once more on the next run. Widen in one edit when several commands are already known, rather than stopping and resuming per command.

Report a widened allowlist in the work summary. Adding a command to a profile grants it credentials.

## Choosing the run mode

- Default stdin is null. Use it for ordinary non-interactive commands.
- `--stdin` streams caller input through a bounded pipe, ending at EOF.
- `--tty` allocates a terminal, merges stdout and stderr, and requires a client terminal. Use it only for genuinely interactive commands.

Exit codes propagate, including `128 + signal`.

## References

- [Profiles and providers](references/profiles.md) — profile fields, credential caching, provider choice, Git and object-storage recipes.
- [Recovery and inspection](references/recovery.md) — interrupted sessions, lost responses, what the journal does and does not retain.

## Boundaries

Latchrun does not confine other processes running as the same user, revoke a credential at its remote service, or keep provider authorization alive. A command that receives a credential can disclose it; output redaction covers exact known values and not encoded or split ones.

Never put a secret value in a profile, an argument, a session name, a path or an operation ID. Profiles hold provider *references* such as `op://vault/item/field`. Keep a profile containing absolute machine paths out of version control.

Prefix commands with `rtk` where it is installed.
