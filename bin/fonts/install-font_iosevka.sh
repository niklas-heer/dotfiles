#!/usr/bin/env bash
#
# Description: This script installs the Iosevka font.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2017-05-01)

main() {
    pkgver=1.12.5
    mkdir -p "$HOME/.local/share/fonts"
    cd /tmp
    wget https://github.com/be5invis/Iosevka/releases/download/v${pkgver}/01-iosevka-${pkgver}.zip
    unzip "01-iosevka-${pkgver}.zip" -d "$HOME/.local/share/fonts"
}

main
