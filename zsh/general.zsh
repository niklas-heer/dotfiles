###################
# General
###################
alias subl=subl3
alias -- +="pushd" # add current diretory to the stack
alias -- -="popd"  # pop first directory from the stack
alias \?="dirs -v" # display the directory stack
zsh_reload() { source ~/.zshrc }
reload() { zsh_reload }
alias open="xdg-open ."
alias o=open
alias ssh_conf="vim ~/.ssh/config"
eval $(thefuck --alias)
isup() { php ~/.dotfiles/bin/isitup.php $1 }
alias dotf="cd ~/.dotfiles"

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

###################
# Tmux
###################
tm()
{
    tmux new -s $1
}

tma()
{
    tmux attach -t $1
}
