# See https://www.nushell.sh/book/configuration.html
# This file is loaded after env.nu and before login.nu

$env.config.show_banner = false

use std/util "path add"
path add "/opt/homebrew/bin" # homebrew
path add ($env.HOME | path join "bin") # chezmoi

# Add Python binaries. This is mainly for pyinfra.
let py_dirs = ls ~/Library/Python/*/bin | get name
path add $py_dirs

# See: https://www.nushell.sh/book/configuration.html#macos-keeping-usr-bin-open-as-open
alias nu-open = open
alias open = ^open
