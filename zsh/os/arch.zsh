# shellcheck disable=SC2148
###########################
# Arch/Antergos/Manjaro
###########################

# Custom Aliases
alias pacman-clean="sudo pacman -Sc && sudo pacman-optimize; yaourt -Syua"
alias pacman-fix="sudo rm /var/lib/pacman/db.lck"

# -------------------
# Software Management
# -------------------
in() {
	# Install Shortcut
	yaourt --noconfirm -S "$@"
}

se() {
	# Search Shortcut
	yaourt --noconfirm "$1"
}

up() {
	# Update Shortcut
	yaourt --noconfirm --aur -Syu
}
