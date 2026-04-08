# Environment variables were previously configured in `env.nu`.
# Most configuration should now be done in `config.nu`.
#
# It is loaded before config.nu and login.nu
# See https://www.nushell.sh/book/configuration.html

# https://www.nushell.sh/book/configuration.html#set-environment-variables
use std/util "path add"
path add [($env.HOME | path join ".bin"), ($env.HOME | path join "bin")] # chezmoi

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
let carapace_dir = ($env.HOME | path join ".cache/carapace")
let carapace_file = ($carapace_dir | path join "init.nu")

if not ($carapace_file | path exists) {
    mkdir $carapace_dir
    carapace _carapace nushell | save --force $carapace_file
}

let zoxide_file = ($env.HOME | path join ".zoxide.nu")

if not ($zoxide_file | path exists) {
    zoxide init nushell | save -f $zoxide_file
}

# https://alexpasmantier.github.io/television/docs/Users/shell-integration/
if (which tv | is-not-empty) {
    let tv_autoload_dir = ($nu.data-dir | path join "vendor/autoload")
    mkdir $tv_autoload_dir
    tv init nu | save -f ($tv_autoload_dir | path join "tv.nu")
}

# add path for container tool: https://github.com/apple/container
path add /usr/local/bin/

# Go setup
$env.GOPATH = ($env.HOME | path join "go")
$env.GOBIN = ($env.GOPATH | path join "bin")
path add $env.GOBIN

# uv installed tools
path add ($env.HOME | path join ".local/bin")

# Preferred editor
$env.EDITOR = "nvim"
$env.VISUAL = "nvim"

# Mirror the essential Nix daemon environment that login shells pick up from
# `nix-daemon.sh`, so `nix` and installed tools work in Nushell as well.
let nix_default_profile = "/nix/var/nix/profiles/default"
let nix_legacy_profile = ($env.HOME | path join ".nix-profile")
let xdg_state_home = ($env.XDG_STATE_HOME? | default ($env.HOME | path join ".local/state"))
let nix_state_profile = ($xdg_state_home | path join "nix/profile")
let nix_user_profile = if ($nix_state_profile | path exists) { $nix_state_profile } else { $nix_legacy_profile }
let nix_binary = ($nix_default_profile | path join "bin/nix")

if ($nix_binary | path exists) {
    $env.NIX_PROFILES = $"($nix_default_profile) ($nix_user_profile)"

    let nix_data_dirs = $"($nix_user_profile)/share:($nix_default_profile)/share"
    let current_xdg_data_dirs = ($env.XDG_DATA_DIRS? | default "")
    $env.XDG_DATA_DIRS = if ($current_xdg_data_dirs | is-empty) {
        $"/usr/local/share:/usr/share:($nix_data_dirs)"
    } else {
        $"($current_xdg_data_dirs):($nix_data_dirs)"
    }

    if (($env.NIX_SSL_CERT_FILE? | default "") | is-empty) {
        let nix_ssl_cert = ([
            "/etc/ssl/certs/ca-certificates.crt"
            "/etc/ssl/ca-bundle.pem"
            "/etc/ssl/certs/ca-bundle.crt"
            "/etc/pki/tls/certs/ca-bundle.crt"
            ($nix_user_profile | path join "etc/ssl/certs/ca-bundle.crt")
            ($nix_default_profile | path join "etc/ssl/certs/ca-bundle.crt")
        ] | where {|cert| $cert | path exists } | get 0? | default "")

        if (not ($nix_ssl_cert | is-empty)) {
            $env.NIX_SSL_CERT_FILE = $nix_ssl_cert
        }
    }

    path add [($nix_user_profile | path join "bin"), ($nix_default_profile | path join "bin")]
}

# https://docs.atuin.sh/guide/installation/
let atuin_dir  = ($env.HOME | path join ".local/share/atuin")
let atuin_file = ($atuin_dir | path join "init.nu")

if not ($atuin_file | path exists) {
    mkdir $atuin_dir
    atuin init nu | save $atuin_file
}
