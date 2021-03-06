# shellcheck disable=SC2148
#############
# macOS
#############

# Custom Exports
export EDITOR=/usr/local/bin/code

# Golang setup
export GOROOT=/usr/local/opt/go/libexec
export PATH="$PATH:$GOROOT/bin"
export GOBIN="$GOPATH/bin"

# Load Custom Files
include "${HOME}/.zsh/os/mac_iterm2.zsh"

# Custom Aliases
alias cask="brew cask"
alias cpwd="pwd | pbcopy"
alias apex-up="/usr/local/bin/up"
alias ls="lsd"
alias python="/usr/local/bin/python3"
alias pip="/usr/local/bin/pip3"

# Software Management
# ------------------
in() {
    # Install Shortcut (brew)
    brew install "$@"
}

se() {
    # Search Shortcut (brew)
    brew search "$@"
}

cin() {
    # Install Shortcut (brew cask)
    cask install "$@"
}

cse() {
    # Install Shortcut (brew cask)
    cask search "$@"
}

up() {
    # Update Shortcut
    brew update
    brew upgrade
}

sm() {
    if [ -z "$1" ]
    then
        smerge .
    else
        smerge "$1"
    fi
}
