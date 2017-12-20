#!/usr/bin/env bash
#
# Description: This script installs a list of extension for visual studio code.
# Author: Niklas Heer (niklas.heer@gmail.com)
# Version: 1.0.0 (2017-12-20)

main() {
	xargs -0 -n 1 code --install-extension < <(tr \\n \\0 <~/.dotfiles/vscode/extensions.lst)
}

main
