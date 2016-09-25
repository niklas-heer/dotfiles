#!/bin/bash

# Prevent the automatic suspend from kicking in.
# see: http://askubuntu.com/questions/222289/how-to-inhibit-suspend-temporarily
function inhibit_suspend()
{
	# Slightly jiggle the mouse pointer about; we do a small step and
	# reverse step to try to stop this being annoying to anyone using the
	# PC. TODO: This isn't ideal, apart from being a bit hacky it stops
	# the screensaver kicking in as well, when all we want is to stop
	# the PC suspending. Can 'caffeine' help?
	export DISPLAY=:0.0
	xdotool mousemove_relative --sync --  1  1
	xdotool mousemove_relative --sync -- -1 -1
}

# formatting
bold=$(tput bold)
normal=$(tput sgr0)

action_interval=10 # in sec
echo "To exit press ${bold}any${normal} key."
if [ -t 0 ]; then stty -echo -icanon -icrnl time 0 min 0; fi

# define vars
start=`date +%s`
count=0
keypress=''
end=0
runtime=0
run=0
display_time=0

# do the loop
while [ "x$keypress" = "x" ]; do
	let end=`date +%s`
	let runtime=$((end-start))

	if (( $runtime % $action_interval == 0 && $runtime >= $action_interval && $run == 0))
	then
		let run=1
	else
		let run=0
	fi

	if [ "$run" = 1 ]; then
		let count+=1
		inhibit_suspend
	fi

	# display the time the script is executed
	display_time=`date -u -d @${runtime} +"%T"`
	echo -ne 'Runtime: '$display_time'\r'

	# sleep a while to prevent the script from running to many times
	sleep 0.5

	# capture the keypress
	keypress="`cat -v`"
done

if [ -t 0 ]; then stty sane; fi

echo "The screen was kept awake $count times."
exit 0
