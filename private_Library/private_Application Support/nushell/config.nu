# See https://www.nushell.sh/book/configuration.html
# This file is loaded after env.nu and before login.nu

# Hide welcome message
$env.config.show_banner = false

# https://carapace-sh.github.io/carapace-bin/setup.html#nushell
source ~/.cache/carapace/init.nu

# See: https://www.nushell.sh/book/configuration.html#macos-keeping-usr-bin-open-as-open
alias m-open = ^open

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
