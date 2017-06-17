#!/usr/bin/env bash

main() {
    pkill plasmashell
    kstart plasmashell --shut-up
}

main
