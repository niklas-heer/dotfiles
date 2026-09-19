# Tooling and tasks

Niklas prefers `mise` for development tool setup and version management, and for project tasks and reusable commands that might otherwise live in a Makefile or Maskfile. He explicitly confirmed `mise` on 2026-09-19.

- For new projects, prefer a project-local mise configuration for required tool versions and common development commands.
- Inspect existing configuration first and reuse its commands. Do not introduce a competing task runner without a concrete need; do not migrate an established project as an incidental change.
- Keep task commands simple and fast. Use the language's native tools underneath, adding scripts only when the task actually needs them.
- Keep machine-wide configuration and installed helpers in the chezmoi-managed dotfiles repository. Mise's tool/task role does not replace chezmoi's configuration deployment role.
- Consult the installed version's help or current official documentation before choosing syntax or installation backends. Do not install or upgrade unrelated software merely because this preference was loaded.

Niklas prefers the [Jev oracle](../../jev-oracle/SKILL.md) for quick, bounded semantic evaluations that could inform a next step. Use the existing session when available, with task-specific uncertainty handling; deterministic checks and direct evidence remain preferable when they settle the question. The oracle advises rather than authorizes or executes decisions.

## CI and delivery

Niklas prefers Dagger with the Dang SDK for CI and, when delivery automation is needed, CD (confirmed 2026-09-19, primarily CI). Use the shared `dagger-ci` skill when setting up or changing pipelines. Keep mise for tool versions and local task shortcuts, with Dagger orchestrating containerized checks. Preserve native platform checks where Linux containers cannot provide equivalent coverage. This is a default for relevant work, not a request to migrate every existing repository or add deployment stages.

For local container engines on macOS, use Apple's native `container` tooling or Colima (confirmed 2026-09-19). Choose between them based on the workload and verified compatibility; do not start or install another engine as a default fallback. Colima provides a Docker-compatible endpoint; Apple's tooling has its own CLI and may require Dagger-specific setup.

## Drift and new-machine readiness

When a workflow gains a tool requirement, check whether it is reproducible from the project's manifests or from dotfiles. Keep project versions and developer tools in project-local mise configuration; keep the shared bootstrap, machine configuration, and installed helpers in dotfiles. Frequent use is a reason to review the baseline, not to install every project's tools globally.

Distinguish a tool missing from the current machine, a missing installation declaration, mismatched project pins, and an intentional optional tool. Inspect opt-in setup scripts before calling a tool unmanaged. An executable found on PATH does not prove a new machine will receive it; compare installed behavior with the current project when an older distribution may remain installed.

Run `mise run audit -- --check` from the hub for a read-only first pass across GHQ root manifests and shared Brewfile requirements; its Rust implementation and setup are owned by the hub. Its report states coverage limits. A passing static audit is not proof of clean-machine onboarding: verify bootstrap, project tool installation, and appropriate build/end-to-end checks in a clean supported environment before making that claim. Record accepted tooling changes and intentional exceptions with the [decision guidance](decisions.md).
