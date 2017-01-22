###################
# Aliases
###################
alias grep="grep --color=auto"
alias tree='tree -C'
alias -- +="pushd" # add current diretory to the stack
alias -- -="popd"  # pop first directory from the stack
alias \?="dirs -v" # display the directory stack
alias lss="ls --sort=size -hs"
alias dotf="cd ~/.dotfiles"
alias o=open
alias catn="cat -n" # Concatenate and print content of files (add line numbers)
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

###################
# Exercism
###################
alias ec="exercism"
alias ecf="exercism fetch"
alias ecs="exercism submit"

###################
# Symfony
###################
alias s_up="php app/console server:run"

###################
# Laravel
###################
alias lar_new="composer create-project laravel/laravel"
alias lar_dev="composer require laravel/homestead --dev; php vendor/bin/homestead make"

##################
# Misc
##################
alias utf8="~/.dotfiles/bin/toUTF8.sh"
alias zshrc="vim ~/.zshrc"
alias starwars="telnet towel.blinkenlights.nl"
alias cow_fortune="exec fortune | cowsay -n"
alias random_word="sort -R /usr/share/dict/usa | head -1"
alias fix_caddy="sudo setcap cap_net_bind_service=+ep /usr/sbin/caddy &>/dev/null"
