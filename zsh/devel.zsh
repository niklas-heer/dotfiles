###################
# Laravel
###################
alias lar_new="composer create-project laravel/laravel"
alias lar_dev="composer require laravel/homestead --dev; php vendor/bin/homestead make"

###################
# Git shortcuts
###################
gDiscard() { git stash save --keep-index; git stash drop }

###################
# Symfony
###################
alias s_up="php app/console server:run"
