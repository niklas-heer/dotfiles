#!/usr/bin/env bash
#
# Description: This script installs the FiraCode font.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.1.0

main() {

	if [[ $(uname) == 'Darwin' ]]; then
		# MacOS
		font_dir="$HOME/Library/Fonts"
	else
		# Linux
		font_dir="$HOME/.local/share/fonts"
		mkdir -p "$font_dir"
	fi

	for type in Bold Light Medium Regular Retina; do
		wget -O "$font_dir/FiraCode-$type.ttf"
		"https://github.com/tonsky/FiraCode/blob/master/distr/ttf/FiraCode-$type.ttf?raw=true"
	done

	# Reset font cache on Linux
	if command -v fc-cache @>/dev/null; then
		echo "Resetting font cache, this may take a moment..."
		fc-cache -f "$font_dir"
	fi

	echo "Installed FiraCode to $font_dir"
}

main
