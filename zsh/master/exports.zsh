###################
# Exports
###################

export TERM=xterm-256color
export EDITOR=/usr/bin/subl
export DEFAULT_USER=nih
export GOPATH="$HOME/Go"
export PATH="/usr/local/bin:$PATH:$GOPATH/bin:$(ruby -e "print Gem.user_dir")/bin:$HOME/.dotfiles/bin:$HOME/.composer/vendor/bin:$HOME/.local/bin:$HOME/.cargo/bin"

# setting for https://github.com/chrisallenlane/cheat
export CHEATPATH="$CHEATPATH:$HOME/.dotfiles/cheat"
export CHEATCOLORS=true
