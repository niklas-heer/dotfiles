###################
# Misc
###################
alias utf8="~/.dotfiles/bin/toUTF8.sh"
alias zshrc="vim ~/.zshrc"
alias starwars="telnet towel.blinkenlights.nl"
alias cow_fortune="exec fortune | cowsay -n"

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

wea()
{
    curl http://wttr\.in/$1
}

alias wea_gdf="wea Gaildorf"
alias wea_an="wea Ansbach"

###################
# School shortcuts
###################
newdir() { mkdir $(date +"%Y-%m-%d"); cd $(date +"%Y-%m-%d") }

###################
# Hugo
###################
blog_serve() { hugo server -w -t "nh" }
blog_new() {
	name=$(echo "$*" | awk '{print tolower($0)}')
	hugo new post/$(date +"%Y-%m-%d")-${name// /-}.md
}
