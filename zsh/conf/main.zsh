autoload bashcompinit
bashcompinit

export TERM=xterm-256color
export EDITOR=/usr/bin/vim
export DEFAULT_USER=nih
export GOPATH=~/go
export PATH="$PATH:$GOPATH/bin:$(ruby -e "print Gem.user_dir")/bin:$HOME/.dotfiles/bin:$HOME/.config/composer/vendor/bin"

# setting for https://github.com/chrisallenlane/cheat
export CHEATPATH="$CHEATPATH:$HOME/.dotfiles/cheat"
export CHEATCOLORS=true

# Autocompletion files
fpath=($HOME/.zsh/autocompletion $fpath)

# VTE support
source /etc/profile.d/vte.sh
