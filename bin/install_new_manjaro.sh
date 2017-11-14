#!/usr/bin/env bash
# This is an install script to install all needed software

# Designed for Manjaro
# By Niklas Heer

main() {
    # Update mirrorlist
    echo "[INFO] Updating mirrorlist..."
    sudo pacman-mirrors -gc Germany

    # Update whole system (may take long)
    echo "[INFO][0] Updating installed packages. May take really long..."
    yaourt -Syu --aur --noconfirm

    # Base tools
    echo "[INFO][1] Installing base tools..."
    yaourt --noconfirm -S vim git vlc tree neovim zsh putty docker jdk8-openjdk shutter wget tmux go tk keepass

    # Dev tools
    echo "[INFO][2] Intalling dev tools..."
    yaourt --noconfirm -S base-devel atom-editor-bin sublime-text-dev netbeans hub-bin pkgbuild-introspection vagrant nodejs npm

    # Addiontal tools
    echo "[INFO][3] Installing additional tools..."
    yaourt --noconfirm -S google-chrome telegram-desktop-bin haroopad spotify-stable caffeine-ng mumble teamspeak3 skype dropbox ufw-extras perl-file-mimeinfo

    # libreoffice-fresh
    echo "[INFO][4] Installing LibreOffice (fresh)..."
    yaourt -R libreoffice-still libreoffice-still-sdk libreoffice-still-sdk-doc && yaourt -S libreoffice-fresh

    # Install fonts
    echo "[INFO][5] Installing Fonts..."
    yaourt --noconfirm -S otf-hack

    # Set up Docker
    echo "[INFO][6] Setting up Docker..."
    systemctl start docker.service
    systemctl enable docker.service
    gpasswd -a nih docker

    # Set up Golang
    echo "[INFO][7] Setting up Golang..."
    export GOPATH=~/Go
    export PATH="$PATH:$GOPATH/bin"
    mkdir -p ~/Go/{bin,src}

    # Install antigen
    echo "[INFO][8] Setting up antigen..."
    mkdir -p ~/tools
    cd ~/tools
    git clone https://github.com/zsh-users/antigen.git

    # Final things
    echo "[INFO] Restart your session to see changes take effect immediatly."
    echo "[INFO] You should install virtualbox"
}

main
