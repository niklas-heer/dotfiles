###################
# Misc
#
# Some of sources:
#    - https://github.com/cep21/jackbash/blob/master/bashrc
#    - http://askubuntu.com/a/379282
###################
alias utf8="~/.dotfiles/bin/toUTF8.sh"
alias zshrc="vim ~/.zshrc"
alias starwars="telnet towel.blinkenlights.nl"
alias cow_fortune="exec fortune | cowsay -n"
alias random_word="sort -R /usr/share/dict/usa | head -1"
alias fix_caddy="sudo setcap cap_net_bind_service=+ep /usr/sbin/caddy &>/dev/null"

random_string() { cat /dev/urandom | tr -dc 'a-z' | fold -w "$1" | head -n 1 }

# kill processes, if you only know the name
akill()
{
    for pid in $(ps -ef | grep "$1" | awk '{print $2}');
    do kill -9 $pid;
    done
}

21days()
{

	NOW=$(date +'%a %d.%m.%y %H:%M')
	THEN=$(date -d "21 days" +'%a %d.%m.%y %H:%M')
	echo "21-day rule\n====================\n\nStart: $NOW\nZiel: $THEN"
}

# Weather
weather() {
    curl http://wttr\.in/$1
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
			weather $1
			;;
	esac
}

# Extract based upon file ext
ex() {
     if [ -f "$1" ] ; then
         case "$1" in
             *.tar.bz2)   tar xvjf "$1"        ;;
             *.tar.gz)    tar xvzf "$1"     ;;
             *.bz2)       bunzip2 "$1"       ;;
             *.rar)       unrar x "$1"     ;;
             *.gz)        gunzip "$1"     ;;
             *.tar)       tar xvf "$1"        ;;
             *.tbz2)      tar xvjf "$1"      ;;
             *.tgz)       tar xvzf "$1"       ;;
             *.jar)       jar xf "$1"       ;;
             *.zip)       unzip "$1"     ;;
             *.Z)         uncompress "$1"  ;;
             *.7z)        7z x "$1"    ;;
             *)           echo "'$1' cannot be extracted via >extract<" ;;
         esac
     else
         echo "'$1' is not a valid file"
     fi
}

# Compress with tar + bzip2
bz2 () {
  tar cvpjf "$1.tar.bz2" "$1"
}

# Grep for a process while at the same time ignoring the grep that
# you're running.  For example
#   ps awxxx | grep java
# will show "grep java", which is probably not what you want
psgrep(){
  OUTFILE=$(mktemp /tmp/psgrep.XXXXX)
  ps awxxx > "$OUTFILE"
  grep "$@" "$OUTFILE"
  rm "$OUTFILE"
}

# Using gcalccmd
# You can also make the function call gcalccmd (from gnome-calculator) like so:
#
# = 'sqrt(2)' # Returns 1.4142135623
# = '4^4'     # Returns 256
#
# list of funtions: https://sourcecodebrowser.com/gcalctool/5.29.2/mp-equation_8c.html#a2c1b83394ed2fe6da08e1538b65fd29b
=() {
    calc="$@"
    # Uncomment the below for (p → +) and (x → *)
    #calc="${calc//p/+}"
    #calc="${calc//x/*}"
    echo -ne "$calc\n quit" | gcalccmd | sed 's:^> ::g'
}

# Repeat a command N times.  You can do something like
#  repeat 3 echo 'hi'
repeat()
{
    local i max
    max=$1; shift;
    for ((i=1; i <= max ; i++)); do
        eval "$@";
    done
}

# Lets you ask a command.  Returns '0' on 'yes'
#  ask 'Do you want to rebase?' && git svn rebase || echo 'Rebase aborted'
ask()
{
    echo -n "$@" '[y/n] ' ; read -r ans
    case "$ans" in
        y*|Y*) return 0 ;;
        *) return 1 ;;
    esac
}

# awesome!  CD AND LA. I never use 'cd' anymore...
cl(){ cd "$@" && la; }

# count characters
count() { echo -n "$1" | wc -c }

# password generator
pwgen() { < /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-21} | cut -d '=' -f 2 | sed 's/;$//' }

###################
# School shortcuts
###################
newdir() { mkdir $(date +"%Y-%m-%d"); cd $(date +"%Y-%m-%d") }

###################
# File transfer
###################
download() { rsync -r -v --progress -e ssh $1 . }
upload() { rsync -r -v --progress -e ssh $2 $1 }
