###########################
# Arch/Antergos/Manjaro
###########################

# Random
alias pacman-clean="sudo pacman -Sc && sudo pacman-optimize; yaourt -Syua"

# Software Management
in() { yaourt --noconfirm -S "$@"; }
up() { yaourt --noconfirm --aur -Syu; }
