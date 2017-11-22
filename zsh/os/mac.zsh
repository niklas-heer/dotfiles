# shellcheck disable=SC2148
#############
# macOS
#############

# Custom Exports
export EDITOR=/usr/local/bin/code

# Custom Aliases
alias cask="brew cask"

# Software Management
# ------------------
in() {
	# Install Shortcut (brew)
	brew install "$@"
}

se() {
	# Search Shortcut (brew)
	brew search "$@"
}

cin() {
	# Install Shortcut (brew cask)
	cask install "$@"
}

cse() {
	# Install Shortcut (brew cask)
	cask search "$@"
}

up() {
	# Update Shortcut
	brew update
	brew upgrade
}
