# shellcheck disable=SC2148
###########
# Ubuntu
###########

# -------------------
# Software Management
# -------------------
in() {
	# Install Shortcut
	sudo apt install "$@"
}

se() {
	# Search Shortcut
	sudo apt search "$1"
}

re() {
	# Reload Repos Shortcut
	sudo apt update
}

up() {
	# Update Shortcut
	sudo apt update && sudo apt upgrade
}

# Python
alias python="python3"
alias pip="pip3"
