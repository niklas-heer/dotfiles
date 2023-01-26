#!/usr/bin/env python3
# coding=utf-8

import datetime
from datetime import timedelta

now = datetime.datetime.now()
diff = timedelta(days=21)
then = now + diff

print("21-day rule\n====================\n")
print("Start: {}".format(now.strftime("%a %d.%m.%y %H:%M")))
print("Goal: {}".format(then.strftime("%a %d.%m.%y %H:%M")))
