#!/bin/bash

# Original script by http://www.reddit.com/u/javajames64
# Updates by http://www.reddit.com/u/OhMrBigshot

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

files=(
	01-Morning.png
	02-Late-Morning.png
	03-Afternoon.png
	04-Late-Afternoon.png
	05-Evening.png
	06-Late-Evening.png
	07-Night.png
	08-Late-Night.png
)

#Timings for the backgrounds in order. Your life may vary.
timing=(
	5
	9
	12
	17
	18
	19
	21
	22
)

hour=`date +%H`
hour=$(echo $hour | sed 's/^0*//')

for i in {7..0..-1}; do # Loop backwards through the wallpapers
    if [[ $hour -ge ${timing[i]} ]]; then
        rm $DIR/screen1/*
        ln -fs $DIR/${files[i]} $DIR/screen1/
        echo "Wallpaper set to ${files[i]}"
        exit
    fi
done

# Fallback at last wallpaper if time is not relevant
rm $DIR/screen1/*
ln -s $DIR/${files[7]} $DIR/screen1/
echo "Wallpaper set to ${files[7]}"
