###################
# Bash Profile 
###################

export _JAVA_OPTIONS='-Dawt.useSystemAAFontSettings=lcd'

if [ -n "$DESKTOP_SESSION" ];then
    eval $(gnome-keyring-daemon --start)
    export SSH_AUTH_SOCK
fi

. "$HOME/.cargo/env"
