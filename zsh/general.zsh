###################
# General
###################
if ! type "subl" > /dev/null 2>&1; then
	alias subl=subl3
fi
alias -- +="pushd" # add current diretory to the stack
alias -- -="popd"  # pop first directory from the stack
alias \?="dirs -v" # display the directory stack
zsh_reload() { source ~/.zshrc }
reload() { zsh_reload }
open() { xdg-open $1 }
alias o=open
alias ssh_conf="vim ~/.ssh/config"
eval $(thefuck --alias)
isup() { php ~/.dotfiles/bin/isitup.php $1 }
alias dotf="cd ~/.dotfiles"
mkd () { mkdir $@ && cd $_ }

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
tm()  { tmux new -s $1 }
tma() { tmux attach -t $1 }
