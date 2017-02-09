##################
# Laravel
##################

# Homestead
HOMESTEAD_HOME="$HOME/Homestead"

homestead()
{
	jump_in $HOMESTEAD_HOME  && vagrant $* && jump_out
}

