#!/bin/sh
# see also: https://forum.manjaro.org/index.php?topic=1157.0

sudo mv /etc/pacman.d/gnupg/ /etc/pacman.d/gnupgold
sudo pacman-key --init
sudo pacman-key --populate archlinux manjaro
sudo pacman-key --refresh 
