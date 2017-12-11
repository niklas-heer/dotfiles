#!/usr/bin/env bash
#
# Description: This script installs awesome fonts.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.2.0

main() {

	if [[ $(uname) == 'Darwin' ]]; then
		# MacOS
		font_dir="$HOME/Library/Fonts"
	else
		# Linux
		font_dir="$HOME/.local/share/fonts"
		mkdir -p "$font_dir"
	fi

	for font in Droid+Sans+Mono+Awesome Inconsolata+Awesome SourceCodePro+Powerline+Awesome+Regular; do
		wget -O "$font_dir/$font.ttf" "https://github.com/gabrielelana/awesome-terminal-fonts/blob/patching-strategy/patched/$font.ttf?raw=true"
	done

	# Reset font cache on Linux
	if command -v fc-cache @>/dev/null; then
		echo "Resetting font cache, this may take a moment..."
		fc-cache -f "$font_dir"
	fi

	echo "Installed all awesome paatched fonts to $font_dir"
}

main
