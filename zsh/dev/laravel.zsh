##################
# Laravel
##################

# Homestead
HOMESTEAD_HOME="$HOME/Homestead"

alias hst="homestead"
homestead()
{
	jump_in $HOMESTEAD_HOME  && vagrant $* && jump_out
}

