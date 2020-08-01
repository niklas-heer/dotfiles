# shellcheck disable=SC2148
###################
# zgen
###################
# https://github.com/tarjoilija/zgen


# load zgen
include "$HOME/.zsh/zgen/zgen.zsh"

# if the init scipt doesn't exist
if ! zgen saved; then
    echo "Creating a zgen save"
    
    # Don't forget to `zgen update` if you change something!
    
    # Load OMZ
    zgen oh-my-zsh
    
    # plugins
    zgen oh-my-zsh plugins/git
    zgen oh-my-zsh plugins/pip
    zgen oh-my-zsh plugins/command-not-found
    zgen oh-my-zsh plugins/lein
    zgen oh-my-zsh plugins/history
    zgen oh-my-zsh plugins/history-substring-search
    zgen oh-my-zsh plugins/jump
    zgen oh-my-zsh plugins/sudo
    zgen oh-my-zsh plugins/man
    zgen oh-my-zsh plugins/zsh-navigation-tools
    zgen oh-my-zsh plugins/docker
    zgen oh-my-zsh plugins/docker-compose
    
    # More plugins: https://github.com/unixorn/awesome-zsh-plugins
    
    # https://github.com/pierpo/fzf-docker
    zgen load pierpo/fzf-docker fzf-docker.plugin.zsh
    
    # https://github.com/greymd/docker-zsh-completion
    zgen load greymd/docker-zsh-completion
    
    # https://github.com/zdharma/fast-syntax-highlighting
    zgen load zdharma/fast-syntax-highlighting
    
    # save all to init script
    zgen save
fi
