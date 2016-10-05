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
