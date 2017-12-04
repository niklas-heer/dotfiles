# target config
TARGET=development
CFLAGS= -c -g -D $(TARGET)

all:
	./install

mac:
	./install pip mac mac-apps rust

linux:
	./install pip linux rust fonts

solus: linux
	./install solus

arch: linux
	./install arch
