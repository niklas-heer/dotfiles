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
alias vscode_install_plugin="xargs -0 -n 1 code --install-extension < <(tr \\n \\0 <~/.dotfiles/notes/VSCode/extensions.lst)"
