# Environment variables were previously configured in `env.nu`.
# Most configuration should now be done in `config.nu`.
#
# It is loaded before config.nu and login.nu
# See https://www.nushell.sh/book/configuration.html

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

mkdir -v ~/.bun/bin
path add ($env.HOME | path join ".bun/bin") # global bun binaries

# https://carapace-sh.github.io/carapace-bin/setup.html#nushell
$env.CARAPACE_BRIDGES = 'zsh,fish,bash,inshellisense'
mkdir -v ~/.cache/carapace
carapace _carapace nushell | save --force ~/.cache/carapace/init.nu
zoxide init nushell | save -f ~/.zoxide.nu

# add path for container tool: https://github.com/apple/container
path add /usr/local/bin/

# Go setup
$env.GOPATH = ($env.HOME | path join "go")
$env.GOBIN = ($env.GOPATH | path join "bin")
path add $env.GOBIN

# https://docs.atuin.sh/guide/installation/
let atuin_dir  = ($nu.home-path | path join ".local/share/atuin")
let atuin_file = ($atuin_dir | path join "init.nu")

if not ($atuin_file | path exists) {
    mkdir $atuin_dir
    atuin init nu | save $atuin_file
}
