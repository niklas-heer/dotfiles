---
name: niklas-preferences
description: Apply Niklas's development preferences for repository work, tools, Rust, tests, reusable facts, decision records, and agent guidance. Load relevant references when making development choices, finishing work, or preserving useful knowledge and preferences.
---

# Niklas's development preferences

Use these preferences to make choices within the task. Distinguish observed facts, required boundaries, flexible defaults, and procedures. Explicit current instructions and applicable project constraints take precedence; recommendations do not require unrelated migrations or tool installation.

Read only the references that affect the current work:

| When | Reference |
| --- | --- |
| Finding, cloning, or changing a repository; committing, pushing, or opening a PR | [Git and repositories](references/git.md) |
| Choosing tool installation, versions, project commands, or a task runner | [Tooling and tasks](references/tooling.md) |
| Preserving or consulting reusable facts; making or reviewing a lasting technical choice | [Knowledge and decision records](references/decisions.md) |
| Recognizing a reusable fact or accepted decision worth saving during ordinary work | [Capture knowledge](../capture-knowledge/SKILL.md) |
| Using a quick semantic evaluation to inform the next step | [Jev oracle](../jev-oracle/SKILL.md) |
| Creating, reviewing, or improving a Rust project, including its API and quality gates | [Rust](references/rust.md) |
| Implementing behavior or choosing and running tests | [Testing](references/testing.md) |
| Evaluating long sequences, failures, recovery, or stateful behavior | [Deterministic simulation](references/simulation.md) |
| Creating, reviewing, or simplifying agent instructions, skills, or durable preferences | [Instruction design](references/instruction-design.md) |

When recording a lasting preference, edit its reference in the dotfiles source (`chezmoi source-path`) and apply the changed managed targets. Preserve user intent and distinguish accepted choices from proposals. Verify changed references resolve and report the concrete result; keep detailed maintenance guidance in the instruction-design reference.
