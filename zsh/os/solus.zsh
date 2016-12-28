###########
# Solus
###########

# Software Management
in() { sudo eopkg -y it "$@"; }
up() { sudo eopkg -y up; }
se() { eopkg -y sr "$1"; }
