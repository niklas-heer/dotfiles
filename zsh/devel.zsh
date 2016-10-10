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
NIH_UPDATABLE_DIRS=()
repos() {
	case "$1" in
		"goto")
			if [ -z "$2" ]; then
				cd "$NIH_REPO_DIR"
			else
				cd "$NIH_REPO_DIR/${NIH_UPDATABLE_DIRS[$2]}"
			fi
			;;
		"show")
			tree -d -L 2 "$NIH_REPO_DIR"
			;;
		"status")
			echo "$NIH_REPO_DIR"

			cd "$NIH_REPO_DIR"

			NIH_UPDATABLE_DIRS=()

			bold=$(tput bold)
			normal=$(tput sgr0)

			all_dirs=0;
			up_dirs=0;

			for file in */*; do
				if [[ -d "$file" && ! -L "$file" ]]; then
					((all_dirs++))
					output="$(git -c color.status=always -C $file status -s -u)"

					if [ ! -z "$output" ]; then

						((up_dirs++))

						NIH_UPDATABLE_DIRS+="$file"

						folder="${file%%/*}";
						subfolder="${file#*/}";
						output="${output/$'\n'/\n│         }";
						echo "├── $folder";
						echo "│   └── ($up_dirs) $subfolder";
						echo "│         $output\n│";
					fi;
				fi;
			done;

			echo "│\n└── ${bold}$up_dirs${normal} out of ${bold}$all_dirs${normal} have changes.";
			cd $OLDPWD
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
