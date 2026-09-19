# Tooling and tasks

Niklas prefers `mise` for development tool setup and version management, and for project tasks and reusable commands that might otherwise live in a Makefile or Maskfile. He explicitly confirmed `mise` on 2026-09-19.

- For new projects, prefer a project-local mise configuration for required tool versions and common development commands.
- Inspect existing configuration first and reuse its commands. Do not introduce a competing task runner without a concrete need; do not migrate an established project as an incidental change.
- Keep task commands simple and fast. Use the language's native tools underneath, adding scripts only when the task actually needs them.
- Keep machine-wide configuration and installed helpers in the chezmoi-managed dotfiles repository. Mise's tool/task role does not replace chezmoi's configuration deployment role.
- Consult the installed version's help or current official documentation before choosing syntax or installation backends. Do not install or upgrade unrelated software merely because this preference was loaded.
