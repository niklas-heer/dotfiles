###################
# Laravel
###################
alias lar_new="composer create-project laravel/laravel"
alias lar_dev="composer require laravel/homestead --dev; php vendor/bin/homestead make"

###################
# Git shortcuts
###################
gdis() { git stash save --keep-index; git stash drop }
glcd() {
    if [ ! -n "$1" ]; then
        echo "Usage: gcd git://example.com/repo.git"
        return;
    fi
    declare url=$1;
    declare reponame=$(echo $url | awk -F/ '{print $NF}' | sed -e 's/.git$//');
    if [ -d "$reponame" ]; then
        cd $reponame;
        return;
    fi
    git clone --recursive $url $reponame;
    echo "\033[31m=>\033[0m \033[036m$reponame\033[0m"
    cd $reponame;
}

###################
# Symfony
###################
alias s_up="php app/console server:run"

###################
# Hugo
###################
BLOG_DIR="$NIH_REPO_DIR/private/blog"

blog() {
	case "$1" in
		"serve")
			hugo server -w -t "nh"
			;;
		"new")
			name=$(echo "$*" | awk '{print tolower($0)}')
			hugo new post/$(date +"%Y-%m-%d")-${name// /-}.md
			;;
		"goto")
			cd "$BLOG_DIR"
			;;
		*)
			echo "Function not defined."
			;;
	esac
}

###################
# Website
###################
web() {
	case "$1" in
		"new")
			echo "Creating a new local website...\n"
			echo "\n\nCreating Caddyfile entry...\n"
			bash -c "cat <<EOIPFW >> Caddyfile
:80 {
	root .
	tls off
	fastcgi / 127.0.0.1:9001 php
}
EOIPFW"
			echo "\nStarting caddy..."
			sudo systemctl restart php-fpm.service
			caddy
			;;
		"start")
			echo "\nStarting caddy..."
			sudo systemctl restart php-fpm.service
			caddy
			;;
		"list")
			echo "TODO: needs to be implemented"
			;;
		"goto")
			echo "TODO: needs to be implemented"
			;;
		*)
			echo "Function not defined."
			;;
	esac
}

###################
# Exercism
###################
alias e="exercism"
alias ef="exercism fetch"
alias es="exercism submit"
