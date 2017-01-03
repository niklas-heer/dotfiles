###################
# General
###################
if ! type "subl" > /dev/null 2>&1; then
	alias subl=subl3
fi
alias grep="grep --color=auto"
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

# Climb directory tree easylly
# Go up directory tree X number of directories
up () {
    COUNTER="$@";
    # default $COUNTER to 1 if it isn't already set
    if [[ -z $COUNTER ]]; then
        COUNTER=1
    fi
    # make sure $COUNTER is a number
    if [ $COUNTER -eq $COUNTER 2> /dev/null ]; then
        nwd=`pwd` # Set new working directory (nwd) to current directory
        # Loop $nwd up directory tree one at a time
        until [[ $COUNTER -lt 1 ]]; do
            nwd=`dirname $nwd`
            let COUNTER-=1
        done
        cd $nwd # change directories to the new working directory
    else
        # print usage and return error
        echo "usage: up [NUMBER]"
        return 1
    fi
}

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
