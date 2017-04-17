#!/usr/bin/env bash
#
# Description: This script installs third party apps on solus.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2017-04-15)

main() {
    cd /tmp

    # Install Chrome
    sudo eopkg bi --ignore-safety https://raw.githubusercontent.com/solus-project/3rd-party/master/network/web/browser/google-chrome-stable/pspec.xml
    sudo eopkg it google-chrome-*.eopkg;sudo rm google-chrome-*.eopkg

    # Install Skype
    sudo eopkg bi --ignore-safety https://raw.githubusercontent.com/solus-project/3rd-party/master/network/im/skype/pspec.xml
    sudo eopkg it skype*.eopkg;sudo rm *.eopkg
}

main
