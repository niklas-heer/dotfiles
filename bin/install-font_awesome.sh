#!/usr/bin/env bash

mkdir -p ~/.local/share/fonts
for font in Droid+Sans+Mono+Awesome Inconsolata+Awesome SourceCodePro+Powerline+Awesome+Regular; do
	wget -O ~/.local/share/fonts/$font.ttf "https://github.com/gabrielelana/awesome-terminal-fonts/blob/patching-strategy/patched/$font.ttf?raw=true";
done
fc-cache -f
