# Allow local customizations in the ~/.zshrc_local_before file
if [ -f ~/.zshrc_local_before ]; then
    source ~/.zshrc_local_before
fi

# Load main configuration
source ~/.zsh/conf/main.zsh

# Load and configure Antigen
source ~/.zsh/conf/antigen.zsh

# Configure Powerlevel9k
source ~/.zsh/conf/powerlevel9k.zsh

# Load helper functions
source ~/.zsh/conf/helpers.zsh

####################################
#
#       Aliases and Functions
#
####################################

# General Shortcuts
source ~/.zsh/general.zsh

# Development Shortcuts
source ~/.zsh/devel.zsh

# Repo Shortcuts
source ~/.zsh/repos.zsh

# Hashing Shortcuts
source ~/.zsh/hash.zsh

# Miscellaneous shortcuts/tools
source ~/.zsh/misc.zsh

# Scripts
source ~/.zsh/scripts/*.zsh

# Special commands for the current os
source ~/.zsh/os/main.zsh

# Allow local customizations in the ~/.zshrc_local_after file
if [ -f ~/.zshrc_local_after ]; then
    source ~/.zshrc_local_after
fi

# Fzf settings - do not change position!
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
