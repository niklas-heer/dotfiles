###################
# General
###################
zsh_reload() { source ~/.zshrc }
reload() { zsh_reload }
open() { ~/.dotfiles/bin/mimi.sh $1 }
eval $(thefuck --alias)
isup() { php ~/.dotfiles/bin/isitup.php $1 }
mkd () { mkdir $@ && cd $_ }

e() {
    if echo -n >> "$1"; then
        $EDITOR $@
    else
        echo -n "sudo [Y/n]? "
        read sudo
        [[ ${sudo:-y} == y ]] && sudo $EDITOR $@ || $EDITOR $@
    fi 2> /dev/null
}

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
# Tmux
###################
tm()  { tmux new -s $1 }
tma() { tmux attach -t $1 }
