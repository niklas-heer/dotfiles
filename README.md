# nheer `dotfiles`

Dotfiles managed with [chezmoi](https://www.chezmoi.io/).

Install chezmoi with:
```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- -b $HOME/bin
```

Install and apply configuration with:
```bash
export GITHUB_USERNAME=niklas-heer
$HOME/bin/chezmoi init --apply --ssh $GITHUB_USERNAME
```

> 🗒️ The scripts are run in alphabetical order.

## Requirements
MacOS 15 or higher (Sequoia).

## Used technology
* [chezmoi](https://www.chezmoi.io/) - keeps the dotfiles in sync and secure
* [homebrew](https://brew.sh) - installs mac applications
* [nushell](https://www.nushell.sh/) - a data first and user-friendly shell

## Tasks

- [ ] write tooling for my decision log
- [ ] add MonoLisa font encrypted and install
- [ ] write a simple todo manager with nu
- [ ] [docker setup with colima](https://medium.com/@guillem.riera/the-most-performant-docker-setup-on-macos-apple-silicon-m1-m2-m3-for-x64-amd64-compatibility-da5100e2557d)
- [ ] Add Raycast configuration

## Project decision log
### 0003 Switch to markdown
* **Status**: ⬆️ Supersedes [0002 Adopt asciidoc](#0002-adopt-asciidoc)
* **Decision**: I will switch to Markdown from asciidoc.
* **Context**: While asciidoc is great, the support for it on GitHub is not. [GitHub doesn't support the flagship feature `include` for years](https://github.com/github/markup/issues/1095). The checklists don't look great, and even the admonitions don't look good out of the box either. I could switch to GitLab, which would solve all the above problems, but I want to stay with GitHub as more people might find it here.
* **Consequences**: I will have to say goodbye to the great asciidoc features like lists, but I now don't seemingly work against what GitHub prefers.

### 0002 Adopt asciidoc
* **Status**: ⛔ Deprecated by [0003 Switch to markdown](#0003-switch-to-markdown)
* **Decision**: I will write asciidocs (adoc) instead of Markdown to document everything in this repo.
* **Context**: I think the asciidocs format is superior. Lists are easier as they don't rely on whitespace. You have powerful macros to do table of contents and admonitions (e.g., a note or a tip). But above all else, you can include other files.
* **Consequences**: Checklists might look worse on GitHub, and people might not be as familiar with it. Tooling might not be on par.

### 0001 Adopt decision logs
* **Status**: ✅ Adopted
* **Decision**: From now on, I will write decision logs explaining why I took a decision so that others might learn from it, or I can reference it later.
* **Context**: I have been working on my dotfiles and choosing different tools, but never really explained why I choose one over another.
* **Consequences**: I will have to write those decision logs quite frequently. Thus, I should build/use tooling for it.
