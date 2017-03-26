#!/usr/bin/env bash
#
# Description: This script let's you blink with the thinkpad light. Maybe useful for notifications.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2017-03-26)

main () {
    perms=$(stat /sys/class/leds/tpacpi::thinklight/brightness | sed -n '/^Access: (/{s/Access: (\([0-9]\+\).*$/\1/;p}')
    if [[ ${perms} =~ 666 ]]; then
        for ((i=0;i<1;i++)); do
            for ((j=0;j<2;j++)); do
                sleep 0.12;
                echo 1 > /sys/class/leds/tpacpi::thinklight/brightness;
                sleep 0.12;
                echo 0 > /sys/class/leds/tpacpi::thinklight/brightness;
            done;
            sleep 0.8;
        done;
    else
        echo "Permission not sufficient enough. You can set them like this:"
        echo "chmod 666 /sys/class/leds/tpacpi\:\:thinklight/brightness"
        return 1
    fi
}

main
