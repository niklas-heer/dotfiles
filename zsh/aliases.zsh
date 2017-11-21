# shellcheck disable=SC2148
###################
# Aliases
###################

alias -- +="pushd" # add current diretory to the stack
alias -- -="popd"  # pop first directory from the stack

alias grep="grep --color=auto"
alias tree="tree -C"
alias mkdir="mkdir -p"
alias o=open
alias lss="ls --sort=size -hs"
alias catn="cat -n" # Concatenate and print content of files (add line numbers)

alias dotf="cd ~/.dotfiles"
alias ssh_conf="vim ~/.ssh/config"

if ! type "subl" > /dev/null 2>&1; then
    alias subl=subl3
fi

###################
# Jump
###################
alias j="jump"
alias jm="mark"
alias jrm="umark"
alias jls="marks"

###################
# Clipboard
###################
alias pbcopy='xclip -selection clipboard'
alias pbpaste='xclip -selection clipboard -o'

##################
# Misc
##################
alias zshrc="vim ~/.zshrc"
alias starwars="telnet towel.blinkenlights.nl"
alias cow_fortune="exec fortune | cowsay -n"
alias random_word="sort -R /usr/share/dict/usa | head -1"
