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
antigen bundle sublime
antigen bundle sudo
antigen bundle man
antigen bundle systemd
antigen bundle zsh-navigation-tools
antigen bundle composer
antigen bundle docker
antigen bundle docker-compose
#antigen bundle autojump # https://github.com/wting/autojump

# Syntax highlighting bundle.
antigen bundle zsh-users/zsh-syntax-highlighting

# Set the right font: https://github.com/gabrielelana/awesome-terminal-fonts
export POWERLEVEL9K_MODE='awesome-patched'

# Load the theme.
antigen theme bhilburn/powerlevel9k powerlevel9k

# Tell antigen that you're done.
antigen apply
