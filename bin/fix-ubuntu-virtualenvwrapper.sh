#!/usr/bin/env bash
#
# Description: This script fixes the following error:
# > virtualenvwrapper.sh: There was a problem running the initialization hooks.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2018-04-20)

pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

main() {
    if [ ! -f /usr/local/bin/python ]; then
        pushd /usr/local/bin
        sudo ln -s `which python3` python
        popd

        echo "The problem should be fixed! Have fun :)"
    else
        echo "It should already work. ;)"
    fi
}

main
