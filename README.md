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

## Local LLM (optional per machine)

The base dotfiles setup does not install an LLM runtime, start a service, or
download model weights. On a capable Apple-silicon Mac, opt in explicitly:

```bash
setup-local-llm             # desktop apps plus 9B and 27B Ollama profiles
setup-local-llm --fast-only # desktop apps plus only the lower-memory 9B model
setup-local-llm --skip-models # install the apps without model downloads
```

The command checks the Mac's architecture, OS version, unified memory, and free
disk space. It installs [Ollama Desktop](https://ollama.com/) and
[oMLX](https://github.com/jundot/omlx) as Mac apps, plus OpenCode as the coding
harness. It also migrates an old Homebrew Ollama service to the desktop app
without deleting `~/.ollama` or its models.

After opting in:

```bash
llm                         # Qwen 3.5 9B: fast daily chat
llm --quality               # Qwen 3.6 27B: best local quality
llm "Explain this error"    # one-shot prompt
llm --status                # show loaded model and GPU placement
llm --stop                  # release unified memory
local-ai                    # coding agent using the fast local model
local-ai --quality          # coding agent using the stronger 27B model
local-llm-ui                # open the oMLX app and its Admin UI
local-llm-ui ollama         # open Ollama Desktop
```

The Ollama profiles use its native MLX engine and a 32K context window. Its API
remains on `http://127.0.0.1:11434`, and cloud features are disabled. oMLX is a
separate runtime with a local Admin UI at `http://127.0.0.1:8000/admin`; its
models are selected interactively and are not duplicated automatically. Avoid
loading large models in both runtimes at once on a unified-memory Mac.

`local-ai` runs the Ollama profiles through OpenCode so it has repository
context, tools, and an edit/test loop instead of operating as raw chat. Extended
thinking is disabled in OpenCode to keep agent loops responsive.

## Post tasks
There are some tasks after the install as they cannot be automated.

- Install SetApp apps: CleanShot X
- Download Premium voices on macOS: "Anna (Premium)", "Jamie (Premium)"
  - https://support.apple.com/guide/mac-help/change-the-voice-your-mac-uses-to-speak-text-mchlp2290/mac

## Project decision log
I want to document my decisions for me so I don't forget and potentially for you so you understand why I use one tool or another or why I remove stuff from time to time.

<!-- DECISION LOG START -->

### 24 Replace Hammerspoon shortcut groups with Keywink
* **Date**: 2026-09-19
* **Status**: 🧪 Trial; intended to supersede [11 Adopting Hammerspoon](#11-adopting-hammerspoon) after live verification
* **Decision**: I will use Keywink for the five Hyper-key shortcut groups previously implemented as Hammerspoon modals.
* **Context**: Keywink now supports direct shortcuts to root groups and can reproduce the existing application, Raycast, CleanShot, Todoist, and custom-function mappings. The configuration belongs in chezmoi at `~/.config/keywink/config.json`; `setup-keywink-shortcuts` recreates Hyper-G/R/S/T/F without defining a separate root shortcut.
* **Verification**: The configuration, shortcut preference values, script syntax (including embedded AppleScript), and SF Symbol names were checked statically. The managed files and preferences were applied, Keywink loaded all five groups, and its application guide was inspected. Hammerspoon was quit for the trial. Physical shortcut use and custom-action behavior still need live verification.
* **Consequences**: The 26 actions and their labels are managed declaratively. Three native macOS scripts replace the selected-text speech, presentation resize, and Amethyst floating functions; they can require Automation and Accessibility permission on first use. Premium Anna and Jamie voices and Amethyst must be installed, and the Slack action requires `/Applications/Slack.app`. The old Hammerspoon configuration remains in source for rollback while this migration is verified. The trial only quits the current Hammerspoon process; it does not remove Hammerspoon, disable its login launch, or alter its configuration.

### 23 Share suitable tooling publicly
* **Status**: ✅ Adopted
* **Decision**: New shareable projects, especially tooling, should default to public when repository publication is authorized; projects containing secrets or private personal information should remain private.
* **Context**: On 2026-09-19, Niklas rejected the previous private-by-default choice for Latchrun and asked to share useful tooling with everyone, with an appropriate license.
* **Consequences**: The shared Git preferences and hub repository-creation skill now require a content/history review before public publication. Existing repositories are not made public automatically. License selection follows each project's requirements and authorization; the choice for Latchrun is MIT.

### 22 Use Jev for useful bounded judgments
* **Status**: ✅ Adopted
* **Decision**: I will use the existing Jev session as a quick advisory oracle when a semantic evaluation can inform the next step.
* **Context**: Niklas requested broader use beyond fact and decision capture. Known-option choices, relevance/support judgments, and rubric-based assessments fit the typed interface.
* **Consequences**: The shared `jev-oracle` skill and routing template make this discoverable across providers. The hub adds a general ask command to the existing credential session. Uncertainty handling is task-specific; the capture threshold is not universal, and model output grants no authority. Direct checks remain preferable where they settle the question.

### 21 Keep the Jev API key in a boot-scoped capture session
* **Status**: ✅ Adopted
* **Decision**: I will keep the TypeSafe credential in 1Password, resolve it only when starting the hub's capture-gate session, and reuse it in that process until stopped or rebooted.
* **Context**: Niklas requested a fast Jev assessment of candidate facts and decisions without repeated credential retrieval. Environment variables belong to processes; a temp file does not provide that lifetime.
* **Consequences**: Mise receives only `TYPESAFE_API_KEY_REF` from a managed configuration fragment. The actual key stays in the session process environment; the temporary directory contains a private socket and lock. The capture skill can consult the active session, while note verification and writes remain with the agent. The 0.85 threshold is provisional and the initial live examples were conservative; the hub preserves results and limits.

### 20 Prefer Dagger with Dang for CI
* **Status**: ✅ Adopted
* **Decision**: I will use Dagger with the Dang SDK as my default for CI and applicable delivery automation, keeping mise for project tool versions and local commands. Local container engines are Apple's native container tooling or Colima.
* **Context**: Explicit preference on 2026-09-19, primarily for CI. Reproducible local pipeline execution and a reusable setup workflow are the intended benefits.
* **Consequences**: The shared tooling preference and `dagger-ci` skill guide relevant CI work; this does not migrate unrelated repositories or introduce deployment stages. The hub adopts a Dang Linux pipeline and keeps native macOS coverage. Dagger versions remain project-local, and runtime compatibility must be checked for the selected engine.

### 19 Capture useful knowledge during ordinary agent work
* **Status**: ✅ Adopted
* **Decision**: I will let agents capture reusable facts and accepted decisions without a separate reminder, using a shared `capture-knowledge` skill.
* **Context**: The facts garden and decision records are useful only when discoveries and choices reach them. Niklas requested automatic recognition during normal tasks.
* **Consequences**: A short shared trigger routes all five provider entry points to the skill. Records stay in their owning repository, with evidence and acceptance kept distinct; duplicate or low-value notes are skipped. Claude Code and Pi receive native skill links. Capture happens in the active task, with no background service or guarantee of model adherence.

### 18 Keep agent guidance focused and evidence-based
* **Status**: ✅ Adopted
* **Decision**: I will keep shared agent entry points small, distinguish facts and boundaries from flexible preferences, and load detailed procedures only when relevant.
* **Context**: Repeating guidance and preserving temporary workarounds increases context use and creates contradictions. Agents need relevant interfaces and evidence for success, with room to reason about implementation.
* **Consequences**: Shared entry points now state the external-content trust boundary. Instruction-maintenance guidance and representative evaluation cases live behind the preference skill's index. The hub references the shared Git guidance instead of repeating it. Explicit commit/push authorization and conditional Rust recommendations remain intact; comparative agent evaluations are reserved for substantial behavior changes.

### 17 Track tooling requirements and preserve decision rationale
* **Status**: ✅ Adopted
* **Decision**: I will declare shared bootstrap commands in dotfiles, retain project-specific tool versions in their own mise manifests, and keep lasting decisions in each repository's existing Markdown log.
* **Context**: Project usage can outgrow the machine setup: `mise`, `gh`, and `rtk` were installed locally but missing from the Brewfile. A new machine needs installation declarations, not just evidence that commands exist on this machine. Morrow's decision log also demonstrates the value of retaining evidence and measured consequences.
* **Consequences**: The three missing shared commands are now in the Brewfile. The hub provides a read-only static audit of GHQ root manifests and shared bootstrap requirements; clean-machine installation and project checks remain separate verification. Optional tools stay opt-in, and common project tools are not automatically promoted to global dependencies. Decision guidance is shared with all configured agents; a possible vrdx format expansion remains a proposal.

### 16 Sharing development preferences across coding agents
* **Status**: ✅ Adopted
* **Decision**: I will keep development preferences in [one shared skill](dot_agents/skills/niklas-preferences/SKILL.md), with a [short routing template](.chezmoitemplates/agent-preferences.md) rendered into instruction files for Codex, Claude Code, Cursor CLI, Pi, and OpenCode.
* **Context**: Each agent discovers personal instructions differently. Shared topic references keep Git/GHQ, mise, Rust, and testing preferences consistent while loading detail only when relevant.
* **Consequences**: Chezmoi installs the entry points and native skill links for Claude Code and Pi; Codex, Cursor, and OpenCode discover the shared skill directly. Edit preference details in `dot_agents/skills/niklas-preferences/`, or edit the routing template and reapply all entry points when routing changes. Cursor's home rule covers workspaces under home; workspaces elsewhere retain global skill discovery. Restart agent sessions after updating global instructions. These are local configurations and must also be installed on other machines or remote environments where needed.

### 15 Adopting opt-in native local LLM runtimes
* **Status**: ✅ Adopted
* **Decision**: I will use the Ollama desktop app with MLX-optimized Qwen profiles for everyday local inference, oMLX for its native Mac app and detailed Admin UI, and OpenCode as the coding harness. Local LLM support is explicitly enabled per machine with `setup-local-llm`; it is not part of the shared Homebrew rollout.
* **Context**: The M2 Pro has 32 GB of unified memory and can run a quantized 27B model locally while retaining a smaller 9B profile for low-latency work. Other Macs receiving these dotfiles may lack the memory, disk capacity, OS version, or Apple-silicon support needed for this workload. Ollama provides broad client compatibility and an official desktop experience, while oMLX provides deeper runtime monitoring and model controls on Apple silicon.
* **Consequences**: A normal `chezmoi apply` only installs inert helper commands and configuration. Running `setup-local-llm` performs hardware checks, installs the apps, and optionally downloads roughly 29 GB of Ollama weights. Ollama remains loopback-only with cloud features disabled. oMLX uses its own model directory and does not receive duplicate model downloads automatically; large models should not be loaded in both runtimes simultaneously.

### 14 Standardizing on zsh
* **Status**: ⬆️ Supersedes [7 Adopting nushell](#7-adopting-nushell)
* **Decision**: I will use `zsh` as my standard interactive and login shell.
* **Context**: Nushell, Fish, and xonsh offer appealing modern features, but their non-POSIX syntax and uneven compatibility mean I still have to return to `zsh` for common commands and macOS workflows. `zsh` is included with macOS, works with the tools I use, and now provides the interactive experience I want through `zsh-autocomplete`, Carapace, and oh-my-posh.
* **Consequences**: Ghostty and Zed will start `/bin/zsh` by default. I will keep the other shell configurations available for experimentation, while maintaining `zsh` as the reliable primary setup.

### 13 Sticking with Amethyst
* **Status**: ✅ Adopted
* **Decision**: I will stick with `Amethyst` instead of trying out `aerospace`.
* **Context**: I prefer automatic tiling window managers over manual ones. While `aerospace` is a great manual tiling window manager, I find that `Amethyst's` automatic tiling fits my workflow better. I don't have to think about managing my windows, they just tile automatically.
* **Consequences**: I will not explore `aerospace` further for now and stick with my `Amethyst` setup.

### 15 Removing Emacs Plus and Doom Emacs
* **Status**: ✅ Adopted
* **Decision**: I will remove `emacs-plus` and `Doom Emacs` from this machine and my dotfiles.
* **Context**: Emacs still does not feel like the right fit for my workflow right now, and I want to keep the setup simple and focused on the tools I actually use day to day.
* **Consequences**: Emacs-specific Homebrew packages, app bundles, shell paths, and Doom configuration will be removed.

### 14 Adopting Emacs Plus and Doom Emacs
* **Status**: ⛔ Deprecated by [15 Removing Emacs Plus and Doom Emacs](#15-removing-emacs-plus-and-doom-emacs)
* **Decision**: I will use `emacs-plus` as my macOS Emacs distribution and `Doom Emacs` as my configuration framework.
* **Context**: Emacs Plus offers a fast, modern macOS build with native compilation and a prebuilt app bundle, while Doom Emacs gives me an opinionated, performant, and well-supported workflow on top of GNU Emacs. This combination balances speed, features, and maintainability better than my previous assumptions.
* **Consequences**: I will maintain a Doom-based Emacs setup and keep Emacs-related configuration in sync with chezmoi.

### 12 Rejecting Doom Emacs
* **Status**: ⛔ Deprecated by [14 Adopting Emacs Plus and Doom Emacs](#14-adopting-emacs-plus-and-doom-emacs)
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
* **Status**: ⛔ Deprecated by [14 Standardizing on zsh](#14-standardizing-on-zsh)
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
