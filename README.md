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

The records live in [`decisions/`](decisions/) as [vrdx](https://github.com/niklas-heer/vrdx)
decision records: one Markdown file each, with TOML metadata between `+++` lines.

```sh
vrdx list
vrdx show <id-or-prefix>
vrdx new "<title>" --body-file <file>
```

They are not deployed to the home directory.
