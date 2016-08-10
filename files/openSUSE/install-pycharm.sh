# run as root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

version=2016.2
pkgname=phpstorm

# prepare diretories
mkdir /opt/${pkgname}
cd /opt/${pkgname}

# download
wget https://download.jetbrains.com/python/pycharm-professional-${version}-no-jdk.tar.gz
tar -xf pycharm-professional-${version}-no-jdk.tar.gz
mv pycharm-*/* .

# clean the directory
rm -rf PhpStorm-*

# give right permissions
chmod -R 777 /opt/${pkgname}

# link binary to make shell command avaible
ln -fs /opt/${pkgname}/bin/${pkgname}.sh /usr/bin/${pkgname}

# write desktop entry
rm /usr/share/applications/jetbrains-${pkgname}.desktop
cat <<EOT >> /usr/share/applications/jetbrains-${pkgname}.desktop
[Desktop Entry]
Version=1.0
Type=Application
Name=PhpStorm
Icon=/opt/phpstorm/bin/webide.png
Exec="/opt/phpstorm/bin/phpstorm.sh" %f
Comment=Develop with pleasure!
Categories=Development;IDE;
Terminal=false
StartupWMClass=jetbrains-phpstorm
EOT
chmod 644 /usr/share/applications/jetbrains-${pkgname}.desktop

# make the icon avaible
cp /opt/${pkgname}/bin/webide.png /usr/share/pixmaps/${pkgname}.png
chmod 644 /usr/share/pixmaps/${pkgname}.png
