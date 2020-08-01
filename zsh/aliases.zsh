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
type exa >/dev/null 2>&1 && alias et="exa -laTgh --git --group-directories-first --level=2"
type exa >/dev/null 2>&1 && alias el="exa -bghla --git --group-directories-first"

###################
# Lynx
###################
alias hints='tmp_f(){ URL_PARAM=$(echo "$@" | sed "s/ /-/g"); lynx -accept_all_cookies https://devhints.io/"$URL_PARAM"; unset -f tmp_f; }; tmp_f'
