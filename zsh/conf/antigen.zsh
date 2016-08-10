source ~/.zsh/antigen/antigen.zsh

# Load the oh-my-zsh's library.
antigen use oh-my-zsh

# Bundles from the default repo (robbyrussell's oh-my-zsh).
antigen bundle git
antigen bundle heroku
antigen bundle pip
antigen bundle lein
antigen bundle command-not-found
antigen bundle history
antigen bundle history-substring-search
antigen bundle jump
antigen bundle sublime
antigen bundle sudo
antigen bundle man
antigen bundle systemd
antigen bundle zsh-navigation-tools
antigen bundle web-search
antigen bundle composer
#antigen bundle autojump # https://github.com/wting/autojump

# Syntax highlighting bundle.
antigen bundle zsh-users/zsh-syntax-highlighting

# Load the theme.
antigen theme bhilburn/powerlevel9k powerlevel9k

# Tell antigen that you're done.
antigen apply
