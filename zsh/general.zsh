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
cdb(){ for i in `seq $1`; do cd ..; done;} # go back n folders
# Use gg in the terminal where you want to go. Then go to the new terminal and use hh.
gg() { pwd > /tmp/last_path; }
hh() { cd $(cat /tmp/last_path); }

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
