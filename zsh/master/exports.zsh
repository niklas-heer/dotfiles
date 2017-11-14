###################
# Exports
###################

export TERM=xterm-256color
export EDITOR=/usr/bin/subl
export DEFAULT_USER=nih
export PATH="$PATH:$GOPATH/bin:$(ruby -e "print Gem.user_dir")/bin:$HOME/.dotfiles/bin:$HOME/.config/composer/vendor/bin:$HOME/.local/bin"
export GOPATH="$HOME/Go"

# setting for https://github.com/chrisallenlane/cheat
export CHEATPATH="$CHEATPATH:$HOME/.dotfiles/cheat"
export CHEATCOLORS=true
