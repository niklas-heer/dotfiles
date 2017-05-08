#!/usr/bin/env bash
#
# Description: This script sets the correct permissions for the ".ssh" folder.
# Reference: http://superuser.com/questions/215504/permissions-on-private-key-in-ssh-folder
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2017-05-08)

main() {
    SSH_FOLDER="$HOME/.ssh"

    # main permissions
    chmod 700 $SSH_FOLDER
    chmod 600 $SSH_FOLDER/*
    chmod 644 $SSH_FOLDER/*.pub

    # known_hosts
    if [ -f $SSH_FOLDER/known_hosts ]; then
        chmod 644 $SSH_FOLDER/known_hosts
    fi

    # config
    if [ -f $SSH_FOLDER/config ]; then
        chmod 644 $SSH_FOLDER/config
    fi
}

main
