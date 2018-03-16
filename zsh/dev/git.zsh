# shellcheck disable=SC2148
###################
# Git shortcuts
###################

gdis() {
	git stash save --keep-index
	git stash drop
}

glcd() {
	# source: https://gist.github.com/azu/8205567
	if [ ! -n "$1" ]; then
		echo "Usage: glcd git://example.com/repo.git"
		return
	fi

	url=$1

	if [ ! -n "$2" ]; then
		reponame=$(echo "$url" | awk -F/ '{print $NF}' | sed -e 's/.git$//')
	else
		reponame=$2
	fi

	if [ -d "$reponame" ]; then
		cd "$reponame" || exit
		return
	fi

	git clone --recursive "$url" "$reponame"
	echo "\033[31m=>\033[0m \033[036m$reponame\033[0m"
	cd "$reponame" || exit
}

gdate() {
	case "$1" in
	-s | set)
		export GIT_COMMITTER_DATE="$2"
		export GIT_AUTHOR_DATE="$2"
		;;
	-u | unset)
		unset GIT_COMMITTER_DATE
		unset GIT_AUTHOR_DATE
		;;
	-*)
		echo "Error: Unknown option: $1" >&2
		;;
	*) # No more options
		echo "Please use <set> or <unset>"
		echo "Format for <set>: YYYY-MM-DD HH:MM:SS"
		;;
	esac
}
