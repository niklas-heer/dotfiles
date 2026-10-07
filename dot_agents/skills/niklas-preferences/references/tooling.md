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

## Disk space and generated build output

Niklas's Mac is regularly close to a full disk, and he asked on 2026-09-27 that agents clean up regenerable data they create as they work, especially debug builds. Rust debug builds with tests easily reach several GB per project.

- Check free space (`df -h ~`) before large builds (release, cross-compile, Nix, container) and after test runs. Prefer lean builds when space is short, such as `CARGO_PROFILE_DEV_DEBUG=0`.
- Remove what you generated once it has served its purpose: debug `target/` output (`cargo clean --profile dev` or the project's clean task), packaged `dist/` files, scratch files in `/tmp`, test data directories, and images or containers you started for a check.
- Use the project's own cleanup tasks where they exist: Earlog has `tools/clean.rs` behind `mise run clean-cache`, `clean-builds` and `clean-ci`; Sideporch has `mise run clean`, `clean-debug` and `clean-ci`. Since 2026-10-08 every Rust project has one: Kindred, Latchrun, Lithra, Repot, Vrdx and Morrow (`fern` checkout) have `mise run clean-debug` and `clean`; Focal and Kipferl have `mise run clean`; Quirl, which uses no task runner, has `cargo xtask clean` (`--all` for everything). Add a similar task to a project that lacks one.
- When the disk is nearly full, run the hub's `rtk mise run clean -- --apply`. It empties Rust debug profiles in every checkout, skipping any that a build holds, and reports other regenerable output. Rust debug profiles are the one kind of other projects' output you may remove without asking. The hub's `clean-disk` skill covers proposing the rest. The dotfiles' `~/.cargo/config.toml` builds dependencies without debug info.
- Only delete data you created or that is clearly regenerable build output of the project you are working on. Other projects' caches, Docker images and volumes, the Colima VM, Homebrew and Nix garbage collection, and `~/.cache` belong to Niklas: report large consumers and ask before removing them.

## Drift and new-machine readiness

When a workflow gains a tool requirement, check whether it is reproducible from the project's manifests or from dotfiles. Keep project versions and developer tools in project-local mise configuration; keep the shared bootstrap, machine configuration, and installed helpers in dotfiles. Frequent use is a reason to review the baseline, not to install every project's tools globally.

Distinguish a tool missing from the current machine, a missing installation declaration, mismatched project pins, and an intentional optional tool. Inspect opt-in setup scripts before calling a tool unmanaged. An executable found on PATH does not prove a new machine will receive it; compare installed behavior with the current project when an older distribution may remain installed.

Run `mise run audit -- --check` from the hub for a read-only first pass across the root manifests of repot's checkouts and shared Brewfile requirements; its Rust implementation and setup are owned by the hub. Its report states coverage limits. A passing static audit is not proof of clean-machine onboarding: verify bootstrap, project tool installation, and appropriate build/end-to-end checks in a clean supported environment before making that claim. Record accepted tooling changes and intentional exceptions with the [decision guidance](decisions.md).
