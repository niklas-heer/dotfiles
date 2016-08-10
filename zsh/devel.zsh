###################
# Laravel
###################
alias lar_new="composer create-project laravel/laravel"
alias lar_dev="composer require laravel/homestead --dev; php vendor/bin/homestead make"

###################
# Docker shortcuts
###################
#alias composer="docker run -v $(pwd):/app composer/composer" 

###################
# Git shortcuts
###################
gDiscard() { git stash save --keep-index; git stash drop }

###################
# Symfony
###################
alias s_up="php app/console server:run"
