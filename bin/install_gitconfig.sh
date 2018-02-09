#!/usr/bin/env bash
#
# Description: This script installs the git config.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2018-02-09)

main() {
    # Use colors, but only if connected to a terminal, and that terminal
    # supports them.
    if which tput >/dev/null 2>&1; then
        ncolors=$(tput colors)
    fi
    if [ -t 1 ] && [ -n "$ncolors" ] && [ "$ncolors" -ge 8 ]; then
        GREEN="$(tput setaf 2)"
        BOLD="$(tput bold)"
        NORMAL="$(tput sgr0)"

        OK=$(printf "%s\xE2\x9C\x94${NORMAL}" "${GREEN}${BOLD}")
    else
        GREEN=""
        BOLD=""
        NORMAL=""

        # Fallback symbols
        OK=$(printf "[ok]")
    fi

    echo "Should I overwrite the ~/.gitconfig file? (y/n) "
    read -p "" -n 1 -r
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        ln -sf "$HOME/.dotfiles/gitconfig" "$HOME/.gitconfig"
        printf "\\n%s%s Gitconfig overwritten.\\n\\n" "${OK}" "${GREEN}"
    fi
}

main
