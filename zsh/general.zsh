# shellcheck disable=SC2148

###################
# General
###################

# ---------------------
# zsh related shortcuts
# ---------------------

# Reload zsh config
zsh_reload() {
	# shellcheck source=/dev/null
	source "$HOME"/.zshrc
}

# Make reload even shorter
reload() {
	zsh_reload
}

# -------------
# Random stuff
# -------------

# Check if a site is down or not
isup() {
	php ~/.dotfiles/bin/isitup.php "$1"
}

# Make a directory and go into it all at once
mkd() {
	mkdir "$@" && cd "$_" || exit
}

# Shortcut to open something in your favorite editor
e() {
	if echo -n >>"$1"; then
		$EDITOR "$@"
	else
		echo -n "sudo [Y/n]? "
		read -r sudo
		if [[ ${sudo:-y} == y ]]; then
			sudo "$EDITOR" "$@"
		else
			$EDITOR "$@"
		fi
	fi 2>/dev/null
}

# Go up directory tree X number of directories
upd() {
	COUNTER="$*"
	# default $COUNTER to 1 if it isn't already set
	if [[ -z $COUNTER ]]; then
		COUNTER=1
	fi
	# make sure $COUNTER is a number
	if [ $COUNTER -eq $COUNTER ] 2>/dev/null; then
		nwd=$(pwd) # Set new working directory (nwd) to current directory
		# Loop $nwd up directory tree one at a time
		until [[ $COUNTER -lt 1 ]]; do
			nwd=$(dirname "$nwd")
			let COUNTER-=1
		done
		cd "$nwd" || exit # change directories to the new working directory
	else
		# print usage and return error
		echo "usage: up [NUMBER]"
		return 1
	fi
}

# ------
# Tmux
# ------
tm() {
	tmux new -s "$1"
}
tma() {
	tmux attach -t "$1"
}
