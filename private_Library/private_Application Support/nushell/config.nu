# See https://www.nushell.sh/book/configuration.html
# This file is loaded after env.nu and before login.nu

# Hide welcome message
$env.config.show_banner = false

# Set theme for bat
$env.BAT_THEME = "Monokai Extended Bright"

# https://carapace-sh.github.io/carapace-bin/setup.html#nushell
if ("~/.cache/carapace/init.nu" | path expand | path exists) {
    source ~/.cache/carapace/init.nu
}

# See: https://www.nushell.sh/book/configuration.html#macos-keeping-usr-bin-open-as-open
alias m-open = ^open
alias lg = lazygit

$env.FZF_DEFAULT_OPTS = "--color=fg:#c0caf5,bg:#1e1f29,hl:#bb9af7 --color=fg+:#FFFFFF,bg+:#1e1f29,hl+:#7dcfff --color=info:#7aa2f7,prompt:#7dcfff,pointer:#7dcfff --color=marker:#9ece6a,spinner:#9ece6a,header:#9ece6a"

# We have to set --env otherwise the cd won't work
def --env repo [] {
    let dirs = ["~/Projects" "~/ghq" "~/.local/share/chezmoi"] | each { path expand } | where { path exists }

    fd -H '^.git$' -t d ...$dirs
    | sd '/.git/' ''
    | fzf --height=40% --layout=reverse --border --info=inline --preview="eza -lhm --no-permissions --total-size --no-user --color=always --icons=always --time-style=relative --sort=modified --reverse {}"
    | cd $in
}

def --env np [...args] {
    let cd_file = (^mktemp -t np-cd.XXXXXX | str trim)

    with-env { NP_CD_FILE: $cd_file } {
        ^np ...$args
    }

    let status = $env.LAST_EXIT_CODE

    if ($cd_file | path exists) {
        let destination = (open $cd_file | str trim)
        rm $cd_file

        if ($status == 0) and (not ($destination | is-empty)) and ($destination | path exists) {
            cd $destination
        }
    }
}

alias newproj = np new
alias graduateproj = np promote

# https://ohmyposh.dev/docs/installation/customize#set-the-configuration
oh-my-posh init nu --config ~/.nheer.omp.yaml

# https://github.com/ajeetdsouza/zoxide
if ("~/.zoxide.nu" | path expand | path exists) {
    source ~/.zoxide.nu
}

# https://docs.atuin.sh/guide/installation/
if ("~/.local/share/atuin/init.nu" | path expand | path exists) {
    source ~/.local/share/atuin/init.nu
}
