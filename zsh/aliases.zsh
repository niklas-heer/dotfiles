# shellcheck disable=SC2148
###################
# Aliases
###################

alias -- +="pushd" # add current diretory to the stack
alias -- -="popd"  # pop first directory from the stack

alias grep="grep --color=auto"
alias tree="tree -C"
alias mkdir="mkdir -p"
alias lss="ls --sort=size -hs"
alias catn="cat -n" # Concatenate and print content of files (add line numbers)

alias dotf="cd ~/.dotfiles"
alias ssh_conf="vim ~/.ssh/config"

if ! type "subl" >/dev/null 2>&1; then
	alias subl=subl3
fi

###################
# Jump
###################
alias j="jump"
alias jm="mark"
alias jrm="umark"
alias jls="marks"

#############################
# Load if the command exists
#############################
type exa >/dev/null 2>&1 && alias el="exa -la"
type exa >/dev/null 2>&1 && alias et="exa -laT --level=2"
type exa >/dev/null 2>&1 && alias ea="exa -bghl --git --group-directories-first"
