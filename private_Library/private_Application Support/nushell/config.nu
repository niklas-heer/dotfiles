# See https://www.nushell.sh/book/configuration.html
# This file is loaded after env.nu and before login.nu

# Hide welcome message
$env.config.show_banner = false

# Set theme for bat
$env.BAT_THEME = "Monokai Extended Bright"

# https://carapace-sh.github.io/carapace-bin/setup.html#nushell
source ~/.cache/carapace/init.nu

# See: https://www.nushell.sh/book/configuration.html#macos-keeping-usr-bin-open-as-open
alias m-open = ^open

alias lg = lazygit

# We have to set --env otherwise the cd won't work
def --env repo [] {
    ["~/Projects/**/.git" "~/ghq/**/.git" "~/.local/share/chezmoi/**/.git"]
    | each { |p| ls ...(glob $p) -D -t }
    | flatten
    | where type == dir
    | sort-by -r modified
    | get name
    | each {|p| $p | str replace "/.git" "" | path relative-to "~" | $"~/($in)"}
    | input list --fuzzy
    | cd $in
}

# https://ohmyposh.dev/docs/installation/prompt
source ~/.oh-my-posh.nu
