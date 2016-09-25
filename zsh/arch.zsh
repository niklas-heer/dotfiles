###########################
# Arch/Antergos/Manjaro
###########################

# Random
alias pacman-clean="sudo pacman -Sc && sudo pacman-optimize; yaourt -Syua"
alias pacman-fix="sudo rm /var/lib/pacman/db.lck"

# Software Management
in() { yaourt --noconfirm -S "$@"; }
up() { yaourt --noconfirm --aur -Syu; }
se() { yaourt --noconfirm "$1"; }
