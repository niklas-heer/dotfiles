###########
# Solus
###########

# Software Management
in() { sudo eopkg -y it "$@"; }
up() { sudo eopkg -y up; }
se() { sudo eopkg -y sr "$1"; }
