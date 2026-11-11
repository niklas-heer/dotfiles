# nheer `dotfiles`

![Terminal](https://raw.github.com/niklas-heer/dotfiles/main/.github/img/2025-02-13_terminal.png "Ghostty & Zsh")

Install [`chezmoi`](https://www.chezmoi.io/) with:
```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- -b $HOME/bin
```
> [!NOTE]
> You'll find the repo cloned to `~/.local/share/chezmoi`

Install and apply configuration with:
```bash
export GITHUB_USERNAME=niklas-heer
$HOME/bin/chezmoi init --apply --ssh $GITHUB_USERNAME
```
<!-- https://github.com/orgs/community/discussions/16925 -->
> [!NOTE]
> The scripts are run in alphabetical order.

## Requirements
* MacOS 15 (Sequoia) or higher
* [1Password and SSH-Agent setup](https://developer.1password.com/docs/ssh/agent/)

## Used technology
* [chezmoi](https://www.chezmoi.io/) - keeps the dotfiles in sync and secure
* [homebrew](https://brew.sh) - installs mac applications
* [zsh](https://www.zsh.org/) - the macOS-native shell, enhanced with real-time completions

## Git repositories

[repot](https://github.com/niklas-heer/repot) is installed by the Brewfile. Zsh loads
its directory-handoff wrapper, so these work in the shell:

```sh
repo                         # built-in repository picker
repo repot                   # jump to a matching checkout
repot get owner/project      # clone into the existing ghq-compatible tree
repot status --no-fetch       # inspect local state without fetching
repot sync --dry-run          # preview safe updates
```

Existing `ghq.root` Git configuration still determines repository locations.
The older `np` helper remains available and uses `repot root`.

## Shell startup

Zsh is the only shell. `~/.zprofile` sets PATH and environment once per login
shell, and `~/.zshrc` sources each tool's `init zsh` output from
`~/.cache/zsh/init/` instead of running the tool. A cache entry is rebuilt when
the tool's Homebrew path or binary changes; delete the directory to force it.
Helpers such as `np`, `nht` and `homelab-*` are autoloaded from
`~/.config/zsh/functions/` on first use. Ghostty and cmux share
`~/.config/ghostty/config`.

## Post tasks
There are some tasks after the install as they cannot be automated.

- Install SetApp apps: CleanShot X
- Download Premium voices on macOS: "Anna (Premium)", "Jamie (Premium)"
  - https://support.apple.com/guide/mac-help/change-the-voice-your-mac-uses-to-speak-text-mchlp2290/mac

## Project decision log
I want to document my decisions for me so I don't forget and potentially for you so you understand why I use one tool or another or why I remove stuff from time to time.

The records live in [`decisions/`](decisions/) as [vrdx](https://github.com/niklas-heer/vrdx)
decision records: one Markdown file each, with TOML metadata between `+++` lines.

```sh
vrdx list
vrdx show <id-or-prefix>
vrdx new "<title>" --body-file <file>
```

They are not deployed to the home directory.
