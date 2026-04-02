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

def --env __nht_apply_action [action_file: string, status: int] {
    if (not ($action_file | path exists)) {
        return $status
    }

    let action_line = (open $action_file | str trim)
    rm $action_file

    if ($status != 0) or ($action_line | is-empty) {
        return $status
    }

    let parts = ($action_line | split row "\t")
    let action = ($parts | get 0)
    let values = ($parts | skip 1)

    if ($action == "cd") {
        let value = ($values | get 0? | default "")
        if (not ($value | is-empty)) and ($value | path exists) {
            cd $value
            return 0
        }
        return $status
    }

    if ($action == "print") {
        print ($values | str join "\t")
        return 0
    }

    if ($action == "open") {
        let value = ($values | get 0? | default "")
        if (not ($value | is-empty)) {
            ^open $value
            return $env.LAST_EXIT_CODE
        }
        return $status
    }

    if ($action == "exec") {
        let program = ($values | get 0? | default "")
        let args = ($values | skip 1)
        if (not ($program | is-empty)) {
            run-external $program ...$args
            return $env.LAST_EXIT_CODE
        }
        return $status
    }

    print $"Unsupported nht shell action: ($action)"
    return 1
}

def __nht_resolve_command [tool: string] {
    ^bun run ~/bin/dev-tools/src/register.ts
    | lines
    | parse "{name}\t{description}\t{command}"
    | where name == $tool
    | get 0?.command
    | default ""
}

def --env nht [...args] {
    let selection = if (($args | length) > 0) {
        __nht_resolve_command ($args | first)
    } else {
        (^tv nht --inline | str trim)
    }

    if ($env.LAST_EXIT_CODE != 0) or ($selection | is-empty) {
        return
    }

    let parts = ($selection | split row " " | where {|part| not ($part | is-empty)})
    if (($parts | length) == 0) {
        return
    }

    let action_file = (^mktemp -t nht-action.XXXXXX | str trim)
    let extra_args = if (($args | length) > 0) { $args | skip 1 } else { [] }

    with-env { NHT_ACTION_FILE: $action_file } {
        run-external ($parts | first) ...($parts | skip 1) ...$extra_args
    }

    let status = $env.LAST_EXIT_CODE
    __nht_apply_action $action_file $status | ignore
}

def --env wtpcd [target?: string] {
    let destination = if ($target | is-empty) {
        ^wtp cd
    } else {
        ^wtp cd $target
    }

    if ($env.LAST_EXIT_CODE == 0) {
        cd ($destination | str trim)
    }
}

alias wcd = wtpcd

def --env --wrapped wtp [...args] {
    if (($args | length) == 0) {
        ^wtp
        return
    }

    let subcommand = ($args | first)

    if ($subcommand == "cd") {
        if (($args | length) > 1) {
            let first_arg = ($args | get 1)
            if ($first_arg == "-h" or $first_arg == "--help") {
                ^wtp ...$args
                return
            }
        }

        let destination = if (($args | length) > 1) {
            ^wtp cd ...($args | skip 1)
        } else {
            ^wtp cd
        }

        if ($env.LAST_EXIT_CODE == 0) {
            let resolved = ($destination | str trim)
            if (not ($resolved | is-empty)) and ($resolved | path exists) {
                cd $resolved
            }
        }

        return
    }

    ^wtp ...$args
}

$env.FZF_DEFAULT_OPTS = "--color=fg:#c0caf5,bg:#1e1f29,hl:#bb9af7 --color=fg+:#FFFFFF,bg+:#1e1f29,hl+:#7dcfff --color=info:#7aa2f7,prompt:#7dcfff,pointer:#7dcfff --color=marker:#9ece6a,spinner:#9ece6a,header:#9ece6a"

# We have to set --env otherwise the cd won't work
def --env repo [...query] {
    let action_file = (^mktemp -t nht-action.XXXXXX | str trim)

    with-env { NHT_ACTION_FILE: $action_file } {
        ^bun run ~/bin/dev-tools/src/repo/index.ts ...$query
    }

    let status = $env.LAST_EXIT_CODE
    __nht_apply_action $action_file $status | ignore
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
