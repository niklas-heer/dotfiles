###################
# Source all
###################

autoload bashcompinit
bashcompinit

# Load exports
source ~/.zsh/master/exports.zsh

# Autocompletion files
fpath=($HOME/.zsh/autocompletion $fpath)

# Load more configuration
source ~/.zsh/master/antigen.zsh            # Load and configure Antigen
source ~/.zsh/master/powerlevel9k.zsh       # Configure Powerlevel9k
source ~/.zsh/master/helpers.zsh            # Load helper functions

# Load Maybe files
include ~/.dotfiles/.simplepush.conf         # Load Simplepush Key

# Aliases and Functions
source ~/.zsh/general.zsh                   # General Shortcuts
source ~/.zsh/aliases.zsh                   # Aliases
source_files_in_dir ~/.zsh/dev/*.zsh        # Development Shortcuts
source ~/.zsh/misc.zsh                      # Miscelaneous shortcuts/tools
source_files_in_dir ~/.zsh/scripts/*.zsh    # Scripts
source ~/.zsh/os/main.zsh                   # Special commands for the current os

# VTE support
include /etc/profile.d/vte.sh
