# nheer `dotfiles`

![Terminal](https://raw.github.com/niklas-heer/dotfiles/main/.github/img/2025-02-13_terminal.png "Ghostty & Nushell")

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
* [nushell](https://www.nushell.sh/) - a data first and user-friendly shell

## Post tasks
There are some tasks after the install as they cannot be automated.

- Install SetApp apps: CleanShot X
- Download Premium voices on macOS: "Anna (Premium)", "Jamie (Premium)"
  - https://support.apple.com/guide/mac-help/change-the-voice-your-mac-uses-to-speak-text-mchlp2290/mac

## Tasks

- [ ] Add roc-lang setup
- [ ] write a simple todo manager with nu
- [ ] [docker setup with colima](https://medium.com/@guillem.riera/the-most-performant-docker-setup-on-macos-apple-silicon-m1-m2-m3-for-x64-amd64-compatibility-da5100e2557d)

## Project decision log
I want to document my decisions for me so I don't forget and potentially for you so you understand why I use one tool or another or why I remove stuff from time to time.

<!-- DECISION LOG START -->

### 13 Sticking with Amethyst
* **Status**: ✅ Adopted
* **Decision**: I will stick with `Amethyst` instead of trying out `aerospace`.
* **Context**: I prefer automatic tiling window managers over manual ones. While `aerospace` is a great manual tiling window manager, I find that `Amethyst's` automatic tiling fits my workflow better. I don't have to think about managing my windows, they just tile automatically.
* **Consequences**: I will not explore `aerospace` further for now and stick with my `Amethyst` setup.

### 12 Rejecting Doom Emacs
* **Status**: ✅ Accepted
* **Decision**: I will not use Doom Emacs.
* **Context**: While I appreciate the integrated nature and completeness of Emacs, and the performance of Doom Emacs specifically, I encountered significant difficulties in installing a current, performant version on macOS. This fiddly installation process goes against my core philosophy that tools must be reliable and easy to set up to be truly useful. Furthermore, adopting Doom Emacs would likely lead me to abandon Zed and Ghostty, two tools I currently value. The benefits of Doom Emacs, including the appeal of org-mode, do not outweigh the costs of instability and sacrificing other liked tools.
* **Consequences**: I will need to find an alternative for org-mode.

### 11 Adopting Hammerspoon
* **Status**: ✅ Adopted
* **Decision**: I will use `Hammerspoon`(https://www.hammerspoon.org/) instead of skhd, Keyboard Maestro or Karabiner-Elements.
* **Context**: I mainly want to create shortcuts to interact with applications, like launching them. I would like to press `hyper+g` first and then press another key like `t` for Terminal to launch my Terminal application. I think you can do that with skhd, but I couldn't make it work, and the project seems stale. Keyboard Maestro is out because I don't know how to do it. Karabiner-Elements is possible, but it is a ton of JSON. Hammerspoon makes it easy, and you can use Lua, a real programming language, to configure it.
* **Consequences**: I have to get used to Hammerspoon and write config.

### 10 Adopting Ghostty
* **Status**: ✅ Adopted
* **Decision**: I will use [`Ghostty`](https://ghostty.org/) instead of Wezterm, Kitty or iTerm.
* **Context**: Ghostty renders superfast. Has great configuration out of the box. Supports macOS-native APIs like passwords or Finder. But it also implements new things like the Kitty image protocol. I believe this is the best Terminal out there at this moment.
* **Consequences**: I get to use a great terminal. Maybe write a bit of config.

### 9 Adopting oh-my-posh
* **Status**: ✅ Adopted
* **Decision**: I use [`oh-my-posh`](https://ohmyposh.dev/) instead of [starship](https://starship.rs/) as my prompt theme engine.
* **Context**: OMP (oh-my-posh) also supports shorting the path name, like [powerlevel9k](https://github.com/Powerlevel9k/powerlevel9k) could. (e.g., `~/.l/s/chezmoi`) It also lets you configure it in whichever format you like. (e.g., TOML, YAML, JSON) It also supports zsh and nushell so I can use it for both. But I guess it is in the end to that big of a difference, so it might come down to personal preference.
* **Consequences**: I have to write configuration.

### 8 Keeping zsh as the login shell
* **Status**: ✅ Adopted
* **Decision**: I leave `zsh` as the login shell.
* **Context**: Usually after using nushell as my main shell, I should also change my login shell via `chsh`, but that also means that the system will use that shell per default. To avoid any errors, I leave `zsh` as the default login shell, but set nushell in all applications I use (like Ghostty or Zed) as the standard shell for day-to-day use.
* **Consequences**: I have to keep a minimal zsh setup.

### 7 Adopting nushell
* **Status**: ✅ Adopted
* **Decision**: I will use [`nushell`](https://www.nushell.sh/) instead of zsh, fish or elvish.
* **Context**: I looked at zsh, fish and elvish as my main shell, but I decided on nushell because it treats command output as structured data rather than plain text, which enables powerful data manipulation and filtering capabilities. I can easily achieve many things with that, for which I would have needed other tools. Thus simplifying my setup. Also, I like the syntax more, as it feels modern and more consistent with great error messages and documentation. For me, I breaking POSIX isn't that big of a deal, as I can still use zsh in those cases, but for my day-to-day use, I want a modern shell syntax.
* **Consequences**: I will rewrite some zsh functions and configure nushell.

### 6 Removing PyInfra
* **Status**: ⬆️ Supersedes [4 Adopt PyInfra](#4-adopt-pyinfra)
* **Decision**: I will use `chezmoi` and a `Brewfile` instead of PyInfra.
* **Context**: After testing the installation on two machines, it didn't work. It broke because some apps were already installed, and I could use the `--force` flag of homebrew. On another occasion, Python didn't install properly. So I decided to solve it via using a [Brewfile](https://homebrew-file.readthedocs.io/en/latest/usage.html) and [chezmoi templates](https://www.chezmoi.io/user-guide/advanced/install-packages-declaratively/). This doesn't require extra dependencies and is simpler and more reliable.
* **Consequences**: I will have to experiment with PyInfra on another project. I also might have to write some shell scripts to set up fonts.

### 5 Adopting chezmoi
* **Status**: ✅ Adopted
* **Decision**: I will use [`chezmoi`](https://www.chezmoi.io/) instead of dotbot to manage my dotfiles.
* **Context**: I looked into different ways to manage my dotfiles. I looked into Nix, but that is too rigid and complex for what I want. I looked into GNU stow and dotbot, but that didn't suit my needs. `chezmoi` supports encrypted secrets, templates, and multi-machine setups and is distributed via a single binary. Having just one command to set up your whole system, which installs the dotfiles manager too, is awesome. Also, chezmoi uses file copying, which prevents potential symlink-related system breakages.
* **Consequences**: I will have to add all my configuration to chezmoi and learn how to use it.

### 4 Adopt PyInfra
* **Status**: ⛔ Deprecated by [6 Removing PyInfra](#6-removing-pyinfra)
* **Decision**: I will use PyInfra to install software.
* **Context**: As I need to install packages and I want to try out PyInfra as it seems cool compared to Ansible as I can just use Python.
* **Consequences**: I will have to make sure Python and the PyInfra are installed.

### 3 Switch to markdown
* **Status**: ⬆️ Supersedes [2 Adopt asciidoc](#2-adopt-asciidoc)
* **Decision**: I will switch to Markdown from asciidoc.
* **Context**: While asciidoc is great, the support for it on GitHub is not. [GitHub doesn't support the flagship feature `include` for years](https://github.com/github/markup/issues/1095). The checklists don't look great, and even the admonitions don't look good out of the box either. I could switch to GitLab, which would solve all the above problems, but I want to stay with GitHub as more people might find it here.
* **Consequences**: I will have to say goodbye to the great asciidoc features like lists, but I now don't seemingly work against what GitHub prefers.

### 2 Adopt asciidoc
* **Status**: ⛔ Deprecated by [3 Switch to markdown](#3-switch-to-markdown)
* **Decision**: I will write asciidocs (adoc) instead of Markdown to document everything in this repo.
* **Context**: I think the asciidocs format is superior. Lists are easier as they don't rely on whitespace. You have powerful macros to do table of contents and admonitions (e.g., a note or a tip). But above all else, you can include other files.
* **Consequences**: Checklists might look worse on GitHub, and people might not be as familiar with it. Tooling might not be on par.

### 1 Adopt decision logs
* **Status**: ✅ Adopted
* **Decision**: From now on, I will write decision logs explaining why I took a decision so that others might learn from it, or I can reference it later.
* **Context**: I have been working on my dotfiles and choosing different tools, but never really explained why I choose one over another.
* **Consequences**: I will have to write those decision logs quite frequently. Thus, I should build/use tooling for it.

### 0 Starting fresh
* **Status**: ✅ Adopted
* **Decision**: I will abandon my previous dotfiles and start new.
* **Context**: I realized that I only used a fraction of the functionality I added over the years, but it was hugely complex. When I wanted to change my `repo` function in zsh it took me a good few minutes to find it. When I then went through the script folder, I noticed that I hadn't used any of it in the last few years. That, paired with the inkling to try some new technology, pointed me to start fresh to have a minimal setup again.
* **Consequences**: I will need to implement features again that worked before.

<!-- DECISION LOG END -->
