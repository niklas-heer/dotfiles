# shellcheck disable=SC2148
###################
# Source all
###################

autoload bashcompinit
bashcompinit

# Load exports
include "$HOME/.zsh/master/exports.zsh"

# Check for update
include "$HOME/.zsh/master/update.zsh"

# Autocompletion files
fpath=($HOME/.zsh/autocompletion $fpath)

# Load more configuration
include "$HOME/.zsh/master/antigen.zsh"      # Load and configure Antigen

include "$HOME/.zsh/master/starship.zsh"     # Load starship prompt

include "$HOME/.zsh/master/helpers.zsh"      # Load helper functions

# Load direnv - https://github.com/direnv/direnv
eval "$(direnv hook zsh)"

# Load Maybe files
include /etc/profile.d/vte.sh                  # VTE support
include "$HOME/.cargo/env"                     # Load rust environment

# Aliases and Functions
include "$HOME/.zsh/general.zsh"               # General Shortcuts
include "$HOME/.zsh/aliases.zsh"               # Aliases
source_files_in_dir "$HOME"/.zsh/dev/*.zsh     # Development Shortcuts
include "$HOME/.zsh/misc.zsh"                  # Miscelaneous shortcuts/tools
source_files_in_dir "$HOME"/.zsh/scripts/*.zsh # Scripts
include "$HOME/.zsh/os/main.zsh"               # Special commands for the current os
