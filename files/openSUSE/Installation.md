# HowTo make openSUSE usable

This is a guide to install all software I need on openSUSE Tumbleweed.

At the moment it is in German, but I'll translate it when it's done.


## Todo

- [x] Spotify
- [x] Arc Theme
- [x] Skype
- [x] Vivaldi
- [x] Mail Howto
- [x] Packman Repo
- [x] SSD Einstellungen
- [x] Ghostwriter (markdown editor)
- [x] PHPStorm
- [x] Rambox
- [x] Sublime
- [ ] Keybase
- [ ] caffeine-ng
- [ ] Gitkraken
- [ ] Teamspeak 3 
- [ ] LAMP Stack (PHP7)
- [ ] Apache-Config Tool (Yast)
- [ ] Cryptomator
- [ ] Nylas N1
- [ ] ausformulieren
- [ ] in Englisch übersetzen

## Apps

```
sudo zypper in ruby-devel git vlc python3-pip python3-devel tree ghostwriter redshift
```


```
sudo zypper in -t pattern devel_basis
```

## Rambox

Just use the AppImage from their page: http://rambox.pro/#download

## Spotify

```
# clone the repo
git clone https://github.com/Barthalion/appimage-spotify.git
cd appimage-spotify

# change the following
diff --git a/Dockerfile b/Dockerfile
index 9d8dd15..6e3bf8f 100644
--- a/Dockerfile
+++ b/Dockerfile
@@ -8,7 +8,8 @@ RUN apt-get update && \
                libfuse2 \
                libglib2.0 \
                librtmp0 \
-               libgconf-2-4
+               libgconf-2-4 \
+               fuse

 ADD Recipe /Recipe
 
 # build the docker container
 docker build -t="appimage-spotify" .
 
 # build the appimage
 mkdir out
 docker run --device /dev/fuse:/dev/fuse:mrw --privileged -v `pwd`/out:/out -t -i appimage-spotify
 
 # Done! 
 # Now you should have a Spotify AppImage in your out folder ready to use!

```

## PhpStorm

Install Script: (*needs testing*)

```bash
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
wget https://download.jetbrains.com/webide/PhpStorm-${version}.tar.gz
tar -xf PhpStorm-${version}.tar.gz
mv PhpStorm-*/* .

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
```

## Skype

Follow the instructions here: https://en.opensuse.org/SDB:Skype

- Download Skype from http://www.skype.com/en/download-skype/skype-for-computer/
- Install dependencies: `sudo zypper install pulseaudio alsa-plugins-pulse alsa-plugins-pulse-32bit pavucontrol libv4l libv4l-32bit libv4l1-0 libv4l1-0-32bit libv4l2-0 libv4l2-0-32bit libv4lconvert0 libv4lconvert0-32bit libpulse0-32bit`
- Install the rpm: `sudo zypper install skype-*.rpm`


For the future the new Skype Electron App could be interesing: https://repo.skype.com/


## Cryptomator

- https://cryptomator.org/downloads/#linuxDownload

## Packman REPO hinzufügen

`zypper ar -f -n packman http://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Tumbleweed/ packman`

## Internal mail

In openSUSE you'll receive system mail. Do get it just use the `mail`-command. Do delete all mail use `delete *` inside the mail app.

## Arc Theme

- https://github.com/zbeptz/KArc-theme

```
 git clone https://github.com/zbeptz/KArc-theme.git && cd KArc-theme
 mkdir -p ~/.local/share/aurorae/themes/
 cp -r {KArc,KArc-Dark} ~/.local/share/aurorae/themes/
 mkdir -p ~/.local/share/plasma/desktoptheme
 cd desktoptheme && cp -r {KArc,KArc-Transparent} ~/.local/share/plasma/desktoptheme
 cd .. && cp {KArcDark.colors,KArc.colors} ~/.local/share/color-schemes
 cp KArc.qtcurve ~/.local/share/QTCurve

```

## Vivaldi

- Zuerst Packman Repo hinzufügen
- `zypper in vivaldi`

## SSD Optimierung

- Yast > Kernel-Einstellungen > Kernel-Einstellungen > Globaler E/A-Planer > NOOP `[noop]` (mit LVM sollte man den Standard drin lassen)

## Insync

- Anleitung: https://forums.insynchq.com/t/repository-for-opensuse/954/19?u=niklas

## Teamviewer

- Public Key hinzufügen `sudo rpm --import https://download.teamviewer.com/download/TeamViewer_Linux_PubKey.asc`
- Teamviewer installieren `sudo zypper in https://download.teamviewer.com/download/teamviewer.i686.rpm`

## Redshift
- zip-Archiv downloaden: https://api.kde-look.org/p/998916
- `.zip` durch `.plamoid` ersetzen
- Plasmoid installieren

## Telegram
- Mit `telegram.ymp` installieren
- KDE Eintrag hinzufügen: `/usr/bin/X11/telegram -- %u`

## Tastatur
- KDE Systemeintsellungen > Eingabegeräte > Tastatur > Belegungen
    - Haken bei Belegungen einrichten
    - Hinzufügen drücken
    - Englisch, Englisch (USA), Englisch (USA international, AltGr-Unicode-Kombination)

## Sublime
- Install Sublime form: https://software.opensuse.org/package/sublime-text-beta
- Install Package Control: https://packagecontrol.io/installation
- Font: http://input.fontbureau.com/, https://github.com/tonsky/FiraCode
- Use configs below:

__Preferences.sublime-settings__:
```
{
	"always_show_minimap_viewport": true,
	"bold_folder_labels": true,
	"caret_extra_bottom": 2,
	"caret_extra_top": 12,
	"caret_extra_width": 2,
	"caret_style": "phase",
	"color_scheme": "Packages/Material Theme/schemes/Material-Theme.tmTheme",
	"default_encoding": "UTF-8",
	"detect_indentation": true,
	"ensure_newline_at_eof_on_save": true,
	"fade_fold_buttons": false,
	"find_selected_text": true,
	"font_face": "Fira Code",
	"font_options": "subpixel_antialias",
	"font_size": 11,
	"highlight_line": true,
	"highlight_modified_tabs": true,
	"ignored_packages":
	[
	],
	"indent_guide_options":
	[
		"draw_normal",
		"draw_active"
	],
	"line_padding_bottom": 2,
	"line_padding_top": 12,
	"overlay_scroll_bars": "enabled",
	"rulers":
	[
		120
	],
	"tab_size": 4,
	"theme": "Material-Theme.sublime-theme",
	"material_theme_small_tab": true,
	"material_theme_tabs_autowidth": true,
	"material_theme_compact_panel": true,
	"material_theme_small_statusbar": true,
	"material_theme_compact_sidebar": true,
	"material_theme_tabs_separator": true,
	"translate_tabs_to_spaces": false,
	"trim_trailing_white_space_on_save": true,
	"word_separators": "./\\()\"'-:,.;<>~!@#%^&*|+=[]{}`~?",
	"word_wrap": true,
	"wrap_width": 120
}
```

__Package Control.sublime-settings__:
```
{
	"bootstrapped": true,
	"in_process_packages":
	[
	],
	"installed_packages":
	[
		"Alignment",
		"ApplySyntax",
		"Block Cursor Everywhere",
		"BracketHighlighter",
		"DocBlockr",
		"Emmet",
		"Facebook Material Theme",
		"GitGutter",
		"Markdown Preview",
		"MarkdownEditing",
		"Material Theme",
		"Material Theme - Appbar",
		"Modific",
		"Package Control",
		"SideBarEnhancements",
		"SmartMarkdown",
		"SublimeCodeIntel",
		"TrailingSpaces",
		"WordCount"
	]
}
```
