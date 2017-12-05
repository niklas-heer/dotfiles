#!/usr/bin/env bash

# Use colors, but only if connected to a terminal, and that terminal
# supports them.
if which tput >/dev/null 2>&1; then
	ncolors=$(tput colors)
fi
if [ -t 1 ] && [ -n "$ncolors" ] && [ "$ncolors" -ge 8 ]; then
	RED="$(tput setaf 1)"
	GREEN="$(tput setaf 2)"
	BLUE="$(tput setaf 4)"
	NORMAL="$(tput sgr0)"
else
	RED=""
	GREEN=""
	BLUE=""
	NORMAL=""
fi

printf "${BLUE}%s${NORMAL}\n" "Updating Dotfiles..."
cd "$DOTFILES" || exit
if git pull --rebase --stat origin master; then
	printf '%s' "$GREEN"
	printf '%s\n' '______      _    __ _ _             '
	printf '%s\n' '|  _  \    | |  / _(_) |            '
	printf '%s\n' '| | | |___ | |_| |_ _| | ___  ___   '
	printf '%s\n' '| | | / _ \| __|  _| | |/ _ \/ __|  '
	printf '%s\n' '| |/ / (_) | |_| | | | |  __/\__ \  '
	printf '%s\n' '|___/ \___/ \__|_| |_|_|\___||___/  '
	printf "${BLUE}%s\n" "Hooray! Your Dotfiles have been updated and/or is at the current version."
else
	printf "${RED}%s${NORMAL}\n" 'There was an error updating. Try again later?'
fi
