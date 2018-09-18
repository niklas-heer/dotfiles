# shellcheck disable=SC2148

###################
# Git shortcuts
###################
alias gsync="~/.dotfiles/bin/gsync.py"
alias grec="git recall -d 5 -a \"all\""

###################
# Exercism
###################
alias ec="exercism"
alias ecf="exercism fetch"
alias ecs="exercism submit"

##################
# Misc
##################
alias utf8="~/.dotfiles/bin/toUTF8.sh"
alias fix_caddy="sudo setcap cap_net_bind_service=+ep /usr/sbin/caddy &>/dev/null"
alias s="subl ."

# Open the url of the curent repo
op() {
    proj_dir='Projects'
    # sed is used to strip out ports, like ":2200"
    proto_url=$(pwd | sed 's~:[[:digit:]]\+~~g')

    python -m webbrowser http://${proto_url##*$proj_dir/}
}
