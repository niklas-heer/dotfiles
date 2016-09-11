#!/bin/sh
export SSH_ASKPASS=/usr/lib/ssh/ksshaskpass
/usr/bin/ssh-add $HOME/.ssh/id_rsa $HOME/.ssh/nh_rsa </dev/null
