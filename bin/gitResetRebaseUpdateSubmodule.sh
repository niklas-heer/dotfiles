#!/bin/sh
reset                            # Konsole leeren
cd ~/$1/tbone/                   # ins git Verzeichnis wechseln
git checkout master              # master Branch auschecken
git reset --hard origin/master   # master Branch auf origin/master zurücksetzen
git fetch
git pull --rebase                # Änderungen aus origin/master abrufen und einspielen
git submodule init               # Submodule initialisieren
git submodule update             # Submodule aktualisieren
php5 ~/$1/tbone/framework/ruckusing/tool/main.php db:setup ENV=9999
php5 ~/$1/tbone/framework/ruckusing/tool/main.php db:migrate ENV=9999
php5 ~/$1/tbone/framework/ruckusing/tool/main.php db:setup ENV=master
php5 ~/$1/tbone/framework/ruckusing/tool/main.php db:migrate ENV=master TEMPLATE=masterdb
# git gc --aggressive
git status
