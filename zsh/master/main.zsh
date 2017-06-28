autoload bashcompinit
bashcompinit

export TERM=xterm-256color
export EDITOR=/usr/bin/subl
export DEFAULT_USER=nih
export GOPATH=~/go
export PATH="$PATH:$GOPATH/bin:$(ruby -e "print Gem.user_dir")/bin:$HOME/.dotfiles/bin:$HOME/.config/composer/vendor/bin:$HOME/.local/bin"

# setting for https://github.com/chrisallenlane/cheat
export CHEATPATH="$CHEATPATH:$HOME/.dotfiles/cheat"
export CHEATCOLORS=true

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
source /etc/profile.d/vte.sh
