# See https://www.nushell.sh/book/configuration.html
# This file is loaded after env.nu and before login.nu

$env.config.show_banner = false

# https://www.nushell.sh/book/configuration.html#set-environment-variables
use std/util "path add"
path add ($env.HOME | path join "bin") # chezmoi

# Homebrew rework the initial command: eval "$(/opt/homebrew/bin/brew shellenv)"
load-env {
    "HOMEBREW_PREFIX": "/opt/homebrew",
    "HOMEBREW_CELLAR": "/opt/homebrew/Cellar",
    "HOMEBREW_REPOSITORY": "/opt/homebrew"
}
path add ["/opt/homebrew/bin", "/opt/homebrew/sbin"]
$env.INFOPATH = "/opt/homebrew/share/info"

# Add Python binaries. This is mainly for pyinfra.
let py_dirs = ls ~/Library/Python/*/bin | get name
path add $py_dirs

# See: https://www.nushell.sh/book/configuration.html#macos-keeping-usr-bin-open-as-open
alias nu-open = open
alias open = ^open

# We have to set --env otherwise the cd won't work
def --env repo [...args] {
    let proj = $"($env.HOME)/Projects"

    if (which fzf | is-empty) {
        error make {msg: "fzf is not installed."}
    }

    let sel = ghq list | if ($args | is-empty) {fzf --border} else {fzf --border --query $args.0} | str trim
    cd $"($proj)/($sel)"
}

# https://ohmyposh.dev/docs/installation/prompt
source ~/.oh-my-posh.nu
