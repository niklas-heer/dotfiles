#############
# macOS
#############

# Custom Aliases
alias cask="brew cask"

# Software Management
# ------------------
in() {
	# Install Shortcut (brew)
	brew install "$@"
}

cin() {
	# Install Shortcut (brew cask)
	cask install "$@"
}

update() {
	# Update Shortcut
	brew update
	brew upgrade
}
