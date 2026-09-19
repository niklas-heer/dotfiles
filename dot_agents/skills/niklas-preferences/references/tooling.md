# Tooling and tasks

Niklas prefers `mise` for development tool setup and version management, and for project tasks and reusable commands that might otherwise live in a Makefile or Maskfile. He explicitly confirmed `mise` on 2026-09-19.

- For new projects, prefer a project-local mise configuration for required tool versions and common development commands.
- Inspect existing configuration first and reuse its commands. Do not introduce a competing task runner without a concrete need; do not migrate an established project as an incidental change.
- Keep task commands simple and fast. Use the language's native tools underneath, adding scripts only when the task actually needs them.
- Keep machine-wide configuration and installed helpers in the chezmoi-managed dotfiles repository. Mise's tool/task role does not replace chezmoi's configuration deployment role.
- Consult the installed version's help or current official documentation before choosing syntax or installation backends. Do not install or upgrade unrelated software merely because this preference was loaded.

## Drift and new-machine readiness

When a workflow gains a tool requirement, check whether it is reproducible from the project's manifests or from dotfiles. Keep project versions and developer tools in project-local mise configuration; keep the shared bootstrap, machine configuration, and installed helpers in dotfiles. Frequent use is a reason to review the baseline, not to install every project's tools globally.

Distinguish a tool missing from the current machine, a missing installation declaration, mismatched project pins, and an intentional optional tool. Inspect opt-in setup scripts before calling a tool unmanaged. An executable found on PATH does not prove a new machine will receive it; compare installed behavior with the current project when an older distribution may remain installed.

Use the hub's `scripts/tooling-audit.py` for a read-only first pass across GHQ root manifests and shared Brewfile requirements. Its report states coverage limits. A passing static audit is not proof of clean-machine onboarding: verify bootstrap, project tool installation, and appropriate build/end-to-end checks in a clean supported environment before making that claim. Record accepted tooling changes and intentional exceptions with the [decision guidance](decisions.md).
