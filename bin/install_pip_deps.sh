#!/usr/bin/env bash
#
# Description: This script installs all pip deps.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.1.0 (2017-11-13)

main() {
	pip_version="pip3"

	if [[ $(uname) == 'Darwin' ]]; then
		# MacOS
		"$pip_version" install -r "$HOME/.dotfiles/pip.conf" --upgrade
	else
		# Linux

		if [ -f /etc/solus-release ]; then
			# Solus
			pip_version="pip"
		fi

		sudo -H "$pip_version" install -r "$HOME/.dotfiles/pip.conf" --upgrade
	fi
}

main
