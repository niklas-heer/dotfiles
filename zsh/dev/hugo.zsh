# shellcheck disable=SC2148
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
