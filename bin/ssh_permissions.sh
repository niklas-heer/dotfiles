#!/bin/sh
# see: http://superuser.com/questions/215504/permissions-on-private-key-in-ssh-folder

SSH_FOLDER="$HOME/.ssh"

chmod 700 $SSH_FOLDER
chmod 600 $SSH_FOLDER/*
chmod 644 $SSH_FOLDER/*.pub

if [ -f $SSH_FOLDER/known_hosts ]; then
    chmod 644 $SSH_FOLDER/known_hosts
fi

if [ -f $SSH_FOLDER/config ]; then
    chmod 644 $SSH_FOLDER/config
fi
