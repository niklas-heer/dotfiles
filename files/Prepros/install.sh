#!/bin/sh

# See: http://discuss.prepros.io/t/install-prepros-on-ubuntu/411/4

# Install Prepros
cd /tmp
wget http://prepros.io.s3.amazonaws.com/installers/Prepros-Linux-5.10.2-64.zip
sudo unzip Prepros-Linux-5.10.2-64.zip -d /opt
sudo cp ~/.dotfiles/files/Prepros/prepros.png /opt/Prepros-linux-64
