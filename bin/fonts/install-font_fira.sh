#!/usr/bin/env bash
#
# Description: This script installs the FiraCode font.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2017-05-01)

main() {
    mkdir -p ~/.local/share/fonts
    for type in Bold Light Medium Regular Retina; do
        wget -O ~/.local/share/fonts/FiraCode-$type.ttf "https://github.com/tonsky/FiraCode/blob/master/distr/ttf/FiraCode-$type.ttf?raw=true";
    done
    fc-cache -f
}

main
