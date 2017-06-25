###########
# Ubuntu
###########

# Software Management
in() { sudo apt install "$@"; }
se() { sudo apt search "$1"; }
update() { sudo apt update && sudo apt upgrade; }

# Python
alias python="python3"
alias pip="pip3"