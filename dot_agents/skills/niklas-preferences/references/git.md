# Git and repositories

## Find and download

- Discover local projects with `rtk ghq list --full-path [query]`. Resolve the current root with `rtk ghq root` and dotfiles with `rtk chezmoi source-path`. Niklas chose live discovery over a maintained hub project index on 2026-09-19; creating, cloning, or relocating a checkout requires no hub registration.
- Use GitHub CLI to search for or confirm the intended remote when needed. Clarify genuinely ambiguous matches before downloading.
- Clone with `ghq get <repository-url>` so the checkout lands under `<ghq root>/<host>/<owner>/<repository>`. Use another location or clone method when explicitly requested. Reuse existing checkouts and preserve their work.
- Keep each project in its own checkout and read its instructions before editing. Confirm GHQ discovers checkouts placed under its roots. GitHub defaults are owner `niklas-heer` and branch `main`.
- Default new shareable projects, especially tooling, to public visibility when publication is requested or part of the authorized repository-creation task. Review files and history for secrets and private personal information first; keep sensitive or personal projects private. This public-first preference was explicitly established on 2026-09-19. A local-only task does not authorize publication, and existing repositories do not become public automatically.
- For new public tooling, include an appropriate open-source license when licensing is authorized; choose a permissive license when broad reuse is the stated goal, and preserve existing license obligations. The Latchrun license choice is project-specific, not a universal license mandate.

## Licensing

- Default new projects to MIT when an open-source license is appropriate. Niklas
  stated on 2026-09-19 that MIT is his normal choice, while requesting Kindred's
  public repository and license. Preserve existing license obligations and honor
  an explicit project-specific choice; this does not relicense existing projects
  or change the ownership or license of user data.

## T3 Code handoff

The desktop app and CLI are installed separately. The official [CLI installer](https://t3.codes/install.sh) installs `t3` under `~/.local/bin`, which the dotfiles shell setup already adds to PATH. For a missing CLI, download and inspect the installer, then run it within an authorized setup task; verify `t3 --version` and `t3 app --help`. Use `t3 update` for subsequent CLI updates. This setup and a successful desktop handoff were verified on 2026-09-19 with version 0.0.42; recheck the official installation docs if packaging changes.

Niklas's preference, revised 2026-09-19: automatically add a project to T3 Code and open a new conversation only when creating a new project. This supersedes the earlier trigger for existing repository work or cloning. This handoff is authorized as part of project creation; no separate confirmation is needed. Resolve the new project's local checkout first and run `rtk t3 app '<absolute-checkout-path>'` once for that project. Discussing, working on, or cloning an existing repository does not trigger a handoff. Follow-up work on the new project should reuse the handoff rather than create more threads. Honor explicit requests to open other projects in T3 Code; for a task settled in the current conversation, the `t3-handoff` skill briefs the new thread through the clipboard so Niklas can choose its model.

The [official T3 Code documentation](https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md#open-a-project-from-a-terminal), checked 2026-09-19, documents `t3 app [path]` as adding the directory as a project if needed and opening a new thread. It requires the desktop app running on the same machine; start the installed app if needed. Check the command result before reporting success. If the CLI or desktop app is unavailable or the command fails, continue the repository work and report the specific blocker with the handoff command; do not silently claim the project was added. Recheck `t3 app --help` and the official docs when the installed version behaves differently. Keep this personal integration out of shared project contributor instructions.

## Commit completed work

- Finish work with atomic local commits by default; no separate request to commit is needed. Each commit should represent one coherent, reversible change, including its directly related tests and documentation. Do not split by file type merely to make more commits.
- Inspect the diff, run appropriate checks, and stage only the task's changes. Preserve unrelated staged and unstaged work. Use conventional commit messages.
- Commit completed logical units as work progresses. If work is incomplete or checks fail, describe that honestly; do not label it complete to satisfy the commit preference.

## Push and pull requests are separate

- Niklas authorizes routine pushes of completed, checked task commits to the repository's existing intended remote and branch by default, so work is available on other devices. Do not wait for an additional approval message when no corrections or review hold remain outstanding. This is standing authorization for this workflow, not a general rule that silence grants permission.
- Honor instructions to keep work local or await review. Inspect the remote, branch, and outgoing commits first; do not publish unrelated local commits. Resolve ordinary synchronization needs without overwriting other work. Do not force-push, rewrite shared history, create a remote, change visibility, or release/deploy software solely because of this preference.
- Opening or merging a pull request is a distinct action governed by the task and repository workflow. Pushing for synchronization alone does not request a PR or authorize a merge.
- Report commit and push status, including any concrete blocker.
