# shellcheck disable=SC2148
###################
# Antigen
###################

include ~/.zsh/antigen/antigen.zsh

# Load the oh-my-zsh's library.
antigen use oh-my-zsh

# Bundles from the default repo (robbyrussell's oh-my-zsh).
antigen bundle git
antigen bundle pip
antigen bundle command-not-found
antigen bundle history
antigen bundle history-substring-search
antigen bundle jump
antigen bundle sudo
antigen bundle man
antigen bundle zsh-navigation-tools
antigen bundle docker
antigen bundle docker-compose
#antigen bundle autojump # https://github.com/wting/autojump

# see: https://github.com/pierpo/fzf-docker
antigen bundle pierpo/fzf-docker

# Syntax highlighting bundle.
antigen bundle zsh-users/zsh-syntax-highlighting

# Tell antigen that you're done.
antigen apply
