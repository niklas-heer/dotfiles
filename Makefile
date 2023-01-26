# target config
TARGET=development
CFLAGS= -c -g -D $(TARGET)

all:
	./install

mac:
	./install pip mac mac-apps

linux:
	./install pip linux fonts

solus: linux
	./install solus

arch: linux
	./install arch

rust:
	./install rust