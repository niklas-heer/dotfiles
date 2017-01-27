# Allow local customizations in the ~/.zshrc_local_before file
if [ -f ~/.zshrc_local_before ]; then
    source ~/.zshrc_local_before
fi

# Load main configuration
source ~/.zsh/conf/main.zsh

# Allow local customizations in the ~/.zshrc_local_after file
if [ -f ~/.zshrc_local_after ]; then
    source ~/.zshrc_local_after
fi

# Fzf settings - do not change position!
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
