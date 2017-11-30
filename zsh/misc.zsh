# shellcheck disable=SC2148
###################
# File transfer
###################
download() {
	rsync -r -v --progress -e ssh "$1" .
}
upload() {
	rsync -r -v --progress -e ssh "$2" "$1"
}

###################
# School shortcuts
###################
newdir() {
	mkdir "$(date +"%Y-%m-%d")"
	cd "$(date +"%Y-%m-%d")" || exit
}

###################
# Misc
#
# Some of sources:
#    - https://github.com/cep21/jackbash/blob/master/bashrc
#    - http://askubuntu.com/a/379282
#    - https://github.com/darnir/dotfiles/blob/master/Packages/Bash/bash_functions
###################

21days() {
	"$HOME/.dotfiles/bin/21days.py"
}

# Weather
weather() {
	curl "http://wttr.in/$1"
}

wea() {
	case "$1" in
	"gdf")
		weather Gaildorf
		;;
	"an")
		weather Ansbach
		;;
	*)
		weather "$1"
		;;
	esac
}

# Extract based upon file ext
extract() {
	if [ -f "$1" ]; then
		case "$1" in
		*.tar.bz2) tar xvjf "$1" ;;
		*.tar.gz) tar xvzf "$1" ;;
		*.bz2) bunzip2 "$1" ;;
		*.rar) unrar x "$1" ;;
		*.gz) gunzip "$1" ;;
		*.tar) tar xvf "$1" ;;
		*.tbz2) tar xvjf "$1" ;;
		*.tgz) tar xvzf "$1" ;;
		*.jar) jar xf "$1" ;;
		*.zip) unzip "$1" ;;
		*.Z) uncompress "$1" ;;
		*.7z) 7z x "$1" ;;
		*) echo "$0: unrecognized file extension: '$1'" >&2 ;;
		esac
	else
		echo "'$1' is not a valid file"
	fi
}
alias ex="extract"

# Function: pack()
# Expects a filename with a valid extension as the first paramter. All other
# parameters list the files that need to be included in the compressed file.
# This function is the dual of the above extract() function. Given a filename,
# it recognizes the type and creates the respective compressed file containing
# all the files provided on the command line.
pack() {
	local FILE
	FILE=$1
	case $FILE in
	*.tar.bz2) shift && tar cjf "$FILE" "$*" ;;
	*.tbz2) shift && tar cjf "$FILE" "$*" ;;
	*.tar.gz) shift && tar czf "$FILE" "$*" ;;
	*.tgz) shift && tar czf "$FILE" "$*" ;;
	*.zip) shift && zip "$FILE" "$*" ;;
	*.rar) shift && rar "$FILE" "$*" ;;
	esac
}

# Compress with tar + bzip2
bz2() {
	tar cvpjf "$1.tar.bz2" "$1"
}

# Function: man()
# Similar to pdflatex, this function is invoked when someone tries to load a man
# page. It adds some amount of syntax colouring to the man page to make it
# easier to scan visually.
man() {
	env \
		LESS_TERMCAP_mb=$'\x1b[38;2;255;200;200m' \
		LESS_TERMCAP_md=$'\x1b[38;2;20;240;240m' \
		LESS_TERMCAP_me=$'\x1b[0m' \
		LESS_TERMCAP_so=$'\x1b[38;2;60;90;90;48;2;40;40;40m' \
		LESS_TERMCAP_se=$'\x1b[0m' \
		LESS_TERMCAP_us=$'\x1b[38;2;150;100;200m' \
		LESS_TERMCAP_ue=$'\x1b[0m' \
		man "$@"
}

# Grep for a process while at the same time ignoring the grep that
# you're running.  For example
#   ps awxxx | grep java
# will show "grep java", which is probably not what you want
psgrep() {
	OUTFILE=$(mktemp /tmp/psgrep.XXXXX)
	ps awxxx >"$OUTFILE"
	grep "$@" "$OUTFILE"
	rm "$OUTFILE"
}

# Repeat a command N times.  You can do something like
#  repeat 3 echo 'hi'
function repeat() {
	local i max
	max=$1
	shift
	for ((i = 1; i <= max; i++)); do
		eval "$@"
	done
}

# List all files/folders only 1 deep
lr() {
	tree -L 2
}

# Where/What is this binary? Shows extended ls output
function what() {
	which "$1" | xargs ls -la
}

# awesome!  CD AND LA. I never use 'cd' anymore... No actually I do.
cl() {
	cd "$@" && la
}

# count characters
count() {
	echo -n "$1" | wc -c
}
