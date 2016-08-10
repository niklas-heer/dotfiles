#!/usr/bin/python
import os
import random
import string
import ftplib
import time
import pyperclip
from subprocess import call, Popen, PIPE, STDOUT
from os.path import expanduser

def randomName(length=6):
	generator = random.SystemRandom()
	alphabet = string.ascii_letters + string.digits
	return str().join(generator.choice(alphabet) for _ in range(length))

def uploadFTP(name, path):
	session = ftplib.FTP(SERVER, USERNAME, PASSWORD)
	file = open(path,'rb')
	session.storbinary('STOR '+name, file)
	file.close()
	session.quit()

"""
    Main Programm
"""
SERVER   = "we-develop.de"
USERNAME = "screens"
PASSWORD = "feJvXMEJs!$6iU^a"
URL      = "http://screens.niklas-heer.de/"
PATH     = expanduser("~") + "/Bilder/screenshots/"

name = randomName() + ".jpg"
screenFile = PATH + name
call(['import', '-frame', screenFile])
# call(['gnome-screenshot', '-a', '-f', screenFile])
# call(['scrot', '-s', name, '-e', "mv $f " + PATH])
uploadFTP(name, screenFile)
pyperclip.copy(URL+name)