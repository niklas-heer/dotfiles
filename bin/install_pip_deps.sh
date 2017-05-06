#!/usr/bin/env bash
#
# Description: This script installs all pip deps.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2017-04-09)

main() {
    pip_version="pip3"

    if [ -f /etc/solus-release ]; then
        # Solus
        pip_version="pip"
    fi

    sudo -H $pip_version install -r $HOME/.dotfiles/pip.conf --upgrade
}

main
