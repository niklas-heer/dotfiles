# Git and repositories

## Find and download

- Consult the hub's `projects.md` when working through the hub; use `ghq list` to find other local checkouts. Resolve the current root with `ghq root`.
- Use GitHub CLI to search for or confirm the intended remote when needed. Clarify genuinely ambiguous matches before downloading.
- Clone with `ghq get <repository-url>` so the checkout lands under `<ghq root>/<host>/<owner>/<repository>`. Use another location or clone method when explicitly requested. Reuse existing checkouts and preserve their work.
- Keep each project in its own checkout and read its instructions before editing. Update the hub index for projects relevant to hub work. GitHub defaults are owner `niklas-heer` and branch `main`.
- Default new shareable projects, especially tooling, to public visibility when publication is requested or part of the authorized repository-creation task. Review files and history for secrets and private personal information first; keep sensitive or personal projects private. This public-first preference was explicitly established on 2026-09-19. A local-only task does not authorize publication, and existing repositories do not become public automatically.
- For new public tooling, include an appropriate open-source license when licensing is authorized; choose a permissive license when broad reuse is the stated goal, and preserve existing license obligations. The Latchrun license choice is project-specific, not a universal license mandate.

## Commit completed work

- Finish work with atomic local commits by default; no separate request to commit is needed. Each commit should represent one coherent, reversible change, including its directly related tests and documentation. Do not split by file type merely to make more commits.
- Inspect the diff, run appropriate checks, and stage only the task's changes. Preserve unrelated staged and unstaged work. Use conventional commit messages.
- Commit completed logical units as work progresses. If work is incomplete or checks fail, describe that honestly; do not label it complete to satisfy the commit preference.

## Push and pull requests are separate

- Niklas authorizes routine pushes of completed, checked task commits to the repository's existing intended remote and branch by default, so work is available on other devices. Do not wait for an additional approval message when no corrections or review hold remain outstanding. This is standing authorization for this workflow, not a general rule that silence grants permission.
- Honor instructions to keep work local or await review. Inspect the remote, branch, and outgoing commits first; do not publish unrelated local commits. Resolve ordinary synchronization needs without overwriting other work. Do not force-push, rewrite shared history, create a remote, change visibility, or release/deploy software solely because of this preference.
- Opening or merging a pull request is a distinct action governed by the task and repository workflow. Pushing for synchronization alone does not request a PR or authorize a merge.
- Report commit and push status, including any concrete blocker.
