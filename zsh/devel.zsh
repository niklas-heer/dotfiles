###################
# Laravel
###################
alias lar_new="composer create-project laravel/laravel"
alias lar_dev="composer require laravel/homestead --dev; php vendor/bin/homestead make"

###################
# Git shortcuts
###################
gDiscard() { git stash save --keep-index; git stash drop }

NIH_REPO_DIR="$HOME/REPOS"
repos() {
	 ~/REPOS
	case "$1" in
		"goto")
			cd "$NIH_REPO_DIR"
			;;
		"show")
			tree -d -L 2 "$NIH_REPO_DIR"
			;;
		*)
			echo "Function not defined."
			;;
	esac
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

			# random=`random_string 6`
			# random="$random.local"

			# echo "\nName? (default: $random)"
			# read web_name

			# if [[ -z "$web_name" ]]; then
			# 	web_name="$random"
			# fi

			# echo "\nDirectory? (default: ${PWD}) "
			# read web_directory

			# if [[ -z "$web_directory" ]]; then
			# 	web_directory="${PWD}"
			# fi

			# echo "\n\nCreating /etc/hosts entry...\n"
			# echo "127.0.0.1    $web_name    localhost" | sudo tee --append /etc/hosts

			echo "\n\nCreating Caddyfile entry...\n"
			bash -c "cat <<EOIPFW >> Caddyfile
:80 {
	root .
	tls off
	fastcgi / 127.0.0.1:9000 php
}
EOIPFW"
			# echo "\n\nVisit your website: http://$web_name (copied to clipboard)"
			# echo -n "http://$web_name" | pbcopy

			echo "\nStarting caddy..."
			sudo systemctl restart php-fpm.service
			# cd $web_directory
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
