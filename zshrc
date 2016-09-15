# Allow local customizations in the ~/.zshrc_local_before file
if [ -f ~/.zshrc_local_before ]; then
    source ~/.zshrc_local_before
fi

# VTE support
source /etc/profile.d/vte.sh

# Load main configuration
source ~/.zsh/conf/main.zsh

# Load and configure Antigen
source ~/.zsh/conf/antigen.zsh

# Configure Powerlevel9k
source ~/.zsh/conf/powerlevel9k.zsh

####################################
#
#       Aliases and Functions
#
####################################

# General Shortcuts
source ~/.zsh/general.zsh

# Development Shortcuts
source ~/.zsh/devel.zsh

# Hashing Shortcuts
source ~/.zsh/hash.zsh

# Miscellaneous shortcuts/tools
source ~/.zsh/misc.zsh

# Allow local customizations in the ~/.zshrc_local_after file
if [ -f ~/.zshrc_local_after ]; then
    source ~/.zshrc_local_after
fi

# Fzf settings - do not change position!
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
