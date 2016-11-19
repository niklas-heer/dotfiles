#!/bin/sh

# kde5-plasma-antu.sh: install/update Antü Plasma Suite [1], an
# "elegant Alternative Suite for Plasma 5" by Fabián Alexis.
#
# The installation is made inside $HOME/.local/share.
#
# This script was tested only in:
#   $ cat /etc/os-release
#   NAME=openSUSE
#   VERSION="Tumbleweed"
#   VERSION_ID="20160331"
#   PRETTY_NAME="openSUSE Tumbleweed (20160331) (x86_64)"
#
# [1] https://github.com/fabianalexisinostroza/Antu

# Copyright © 2016 Antonio Hernández Blas <hba.nihilismus@gmail.com>
# This work is free. You can redistribute it and/or modify it under the
# terms of the Do What The Fuck You Want To Public License, Version 2,
# as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.

antu_git="https://github.com/samuelramox/Antu"
antu_home="$HOME/.local/share/tmp/Antu"

set -e

echo
echo " => Downloading a new copy of Antu"
echo "    ${antu_git} => ${antu_home}"

mkdir -p $HOME/.local/share/tmp
cd $HOME/.local/share/tmp
rm -rf Antu
echo
git clone ${antu_git} || exit 1
echo

echo " => Installing icons ..."

mkdir -p $HOME/.local/share/icons
cd $HOME/.local/share/icons

ls -1d ../tmp/Antu/Icons/* | while read directory; do
  ln -sf "${directory}" .
done

echo " => Installing window decorations ..."

# Aurorae support was removed in Antü +3
# (https://github.com/fabianalexisinostroza/Antu/releases/tag/antu-1.4)
#mkdir -p $HOME/.local/share/aurorae/themes || exit 1
#cd $HOME/.local/share/aurorae/themes || exit 1
#ls -1d ../../tmp/Antu/Decorations/Aurorae/* | while read directory; do
#  ln -sf "${directory}" .
#done

mkdir -p $HOME/.local/share/kwin/decorations
cd $HOME/.local/share/kwin/decorations

ls -1d ../../tmp/Antu/Decorations/Kwin/* | while read directory; do
  # (1): From https://github.com/demitriusbelai/kwin_win8/blob/master/install.sh
  # these files *must* be copied to be available in kde/kwin, so they can not
  # be symlinks.
  decoration_directory="$(basename ${directory})"
  echo "    => Deleting $(pwd)/${decoration_directory}"
  rm -rf "${decoration_directory}"
  cp -rf "${directory}" .
done

mkdir -p $HOME/.local/share/kservices5/
cd $HOME/.local/share/kservices5/
ls -1d ../tmp/Antu/Decorations/Kwin/*/metadata.desktop | while read directory; do
  # Same as (1).
  desktop_file="$(basename $(dirname ${directory}))".desktop
  echo "    => Deleting $(pwd)/${desktop_file}"
  rm -rf "${desktop_file}"
  cp "${directory}" "${desktop_file}"
done
echo "    => Rebuilding the system configuration cache ..."
kbuildsycoca4 2>/dev/null
kbuildsycoca5 2>/dev/null

echo " => Installing theme ..."

mkdir -p $HOME/.local/share/plasma/desktoptheme
cd $HOME/.local/share/plasma/desktoptheme

ls -1d ../../tmp/Antu/Antu*Plasma*Theme*/* | while read directory; do
  ln -sf "${directory}" .
done

echo " => Installing color schemes ..."

mkdir -p $HOME/.local/share/color-schemes
cd $HOME/.local/share/color-schemes

ls -1d ../tmp/Antu/Color*Schemes*/* | while read directory; do
  ln -sf "${directory}" .
done

echo " => Installing wallpapers ..."

mkdir -p $HOME/.local/share/wallpapers
cd $HOME/.local/share/wallpapers

ls -1d ../tmp/Antu/Wallpapers/* | while read directory; do
  ln -sf "${directory}" .
done

echo " => Done"
echo
