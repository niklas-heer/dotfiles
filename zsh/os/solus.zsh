# shellcheck disable=SC2148
###########
# Solus
###########

# -------------------
# Software Management
# -------------------
in() {
	# Install Shortcut
	sudo eopkg -y it "$@"
}
se() {
	# Search Shortcut
	eopkg -y sr "$1"
}
update() {
	# Update Shortcut
	sudo eopkg -y up
}

# Alias git with hub
if [ -f /usr/bin/hub ]; then
	alias git=hub
fi

# Alias Visual Studio Code
if [ -f /usr/bin/code-oss ]; then
	code() { (code-oss "$@" >/dev/null 2>&1 &); }
fi
