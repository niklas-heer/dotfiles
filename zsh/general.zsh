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

repo() {
	REPO_PATH="$HOME/Projects"

	if hash fzf 2>/dev/null; then
		# Give to option to provide a search query from the start like this: repo <search> (...or not)
		if [ -z ${1+x} ]; then
			GOTO_PATH=${$(find "$REPO_PATH" -name .git -type d -prune | fzf --border)%.git}
		else
			GOTO_PATH=${$(find "$REPO_PATH" -name .git -type d -prune | fzf --border --query="$1")%.git}
		fi

		# If we haven't select anything we don't need to cd
		if [ -n "$GOTO_PATH" ]; then
			cd $GOTO_PATH || exit
		fi
	else
		cd "$REPO_PATH" || exit
	fi
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
	# tm - create new tmux session, or switch to existing one. Works from within tmux too. (@bag-man)
	# `tm` will allow you to select your tmux session via fzf.
	# `tm irc` will attach to the irc session (if it exists), else it will create it.
	[[ -n "$TMUX" ]] && change="switch-client" || change="attach-session"
	if [ $1 ]; then
		tmux $change -t "$1" 2>/dev/null || (tmux new-session -d -s $1 && tmux $change -t "$1"); return
	fi
	session=$(tmux list-sessions -F "#{session_name}" 2>/dev/null | fzf --exit-0) &&  tmux $change -t "$session" || echo "No sessions found."
}
