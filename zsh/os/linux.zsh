# shellcheck disable=SC2148
###########
# Linux
###########

# Custom Exports
export EDITOR=/usr/bin/vim
export PATH="$PATH:$GOROOT/bin"
export GOBIN="$GOPATH/bin"

# Custom Aliases
alias pbcopy='xclip -selection clipboard'
alias pbpaste='xclip -selection clipboard -o'
