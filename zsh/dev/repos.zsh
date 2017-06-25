NIH_REPO_DIR="$HOME/repos"
NIH_UPDATABLE_DIRS=()

#########################
# The command line help #
#########################
nih_repo_display_help() {
    echo "Usage: repos [option...]" >&2
    echo
    echo "   -h, help           Displays this help page."
    echo "   -l, list           Displays a tree of all repos."
    echo "   -s, status         Displays all repos with uncommited changes."
    echo "   -j, jump <int>     Jumps into the repo main dir. ($NIH_REPO_DIR)"
    echo "              └────── Jumps into the repo which number is provided by \"status\"."
    echo
}

##################
# Status command #
##################
nih_repo_status() {
    echo "$NIH_REPO_DIR"
    cd "$NIH_REPO_DIR"

    NIH_UPDATABLE_DIRS=()

    bold=$(tput bold)
    normal=$(tput sgr0)

    all_dirs=0;
    up_dirs=0;

    for file in */*; do
        if [[ -d "$file" && ! -L "$file" ]]; then
            ((all_dirs++))
            output="$(git -c color.status=always -C $file status -s -u)"

            if [ ! -z "$output" ]; then

                ((up_dirs++))

                NIH_UPDATABLE_DIRS+="$file"

                folder="${file%%/*}";
                subfolder="${file#*/}";
                output="${output//$'\n'/\n│             }";
                echo "├── $folder";
                echo "│   └── ($up_dirs) $subfolder";
                echo "│             $output\n│";
            fi;
        fi;
    done;

    if [ "$up_dirs" -eq "0" ]; then
        echo "└── ${bold}Everything is okay. :)${normal}";
    else
        echo "│\n└── ${bold}$up_dirs${normal} out of ${bold}$all_dirs${normal} have changes.";
    fi

    cd $OLDPWD
}

list() {
    tree -d -L 3 "$NIH_REPO_DIR"
}


repos() {
    case "$1" in
        -h | help)
            nih_repo_display_help  # Call your function
            ;;
        -j | jump)
            if [ -z "$2" ]; then
                cd "$NIH_REPO_DIR"
            else
                cd "$NIH_REPO_DIR/${NIH_UPDATABLE_DIRS[$2]}"
            fi
            ;;
        -l | list)
            list
            ;;
        -s | status)
            nih_repo_status
            ;;
        -*)
            echo "Error: Unknown option: $1" >&2
            ;;
        *)  # No more options
            list
            ;;
    esac
}

alias rp=repos
