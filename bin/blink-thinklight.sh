#!/bin/bash

# To use this script run:
# chmod 666 /sys/class/leds/tpacpi\:\:thinklight/brightness

for i in {1..1}
do
	for i in {1..2}
	do
		sleep 0.12;
		echo 1 > /sys/class/leds/tpacpi\:\:thinklight/brightness;
		sleep 0.12;
		echo 0 > /sys/class/leds/tpacpi\:\:thinklight/brightness;
	done;
	sleep 0.8;
done;
