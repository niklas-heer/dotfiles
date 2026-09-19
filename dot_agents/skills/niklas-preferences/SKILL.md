---
name: niklas-preferences
description: Apply Niklas's development preferences for repository work, tools, Rust, tests, and decision records. Load relevant references when making development choices, finishing work, checking tooling drift, or recording a durable preference or decision.
---

# Niklas's development preferences

These are durable preferences expressed by Niklas, initially captured on 2026-09-19. Apply them within the current task. Explicit current instructions and project constraints take precedence; do not migrate unrelated project infrastructure just to match a preference.

Read only the references that affect the current work:

| When | Reference |
| --- | --- |
| Finding, cloning, or changing a repository; committing, pushing, or opening a PR | [Git and repositories](references/git.md) |
| Choosing tool installation, versions, project commands, or a task runner | [Tooling and tasks](references/tooling.md) |
| Making or recording a lasting technical choice, reviewing its rationale, or considering a tool change | [Decision records](references/decisions.md) |
| Creating, reviewing, or improving a Rust project, including its API and quality gates | [Rust](references/rust.md) |
| Implementing behavior or choosing and running tests | [Testing](references/testing.md) |
| Evaluating long sequences, failures, recovery, or stateful behavior | [Deterministic simulation](references/simulation.md) |

When Niklas expresses a lasting preference, update the relevant reference in the dotfiles source repository (resolve it with `chezmoi source-path`) and apply only the changed managed files. Keep one source of truth. Separate what Niklas actually requested from implementation suggestions and unresolved choices. Add a new topic only when the existing topics do not fit; update this routing table with its trigger. Do not store credentials or copy whole conversations. Do not claim to have captured earlier prompts that are unavailable.
