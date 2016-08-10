#!/bin/bash

pwd=`pwd`               # Save current directory
relative="files/BitDay"   # Save relative path in repo
sep="--------------------------------------------------------------------------"

echo $sep
echo "* Creating cron jobs... "
echo

echo "* Creating a cron job to run every hour... [1/2]"

line="0 * * * * ${pwd}/${relative}/update.sh"
if ! crontab -l | grep -Fxq "$line"; then
    (crontab -l ; echo "$line") | crontab -
else
    echo "- Cron already exists, skipping."
fi

echo

echo "* Creating a cron job to run after each reboot... [2/2]"

line="@reboot ${pwd}/${relative}/update.sh"
if ! crontab -l | grep -Fxq "$line"; then
    (crontab -l ; echo "$line") | crontab -
else
    echo "- Cron already exists, skipping."
fi

echo


echo "Done!"
