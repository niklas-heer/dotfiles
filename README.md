# Dotfiles

![Screenshot](https://raw.githubusercontent.com/niklas-heer/dotfiles/master/.github/images/zsh_01.png)

These dotfiles use [Dotbot][dotbot] for installation. <br/>
These dotfiles should also update automatically every once in a while. :wink:

## Installation

1. Clone this repo somewhere in your `$HOME`.
2. Run `make`.
3. Change you standard shell to `zsh`.
4. Change your `~/.gitconfig`.
5. Profit. :dollar:

> Note that the install script is idempotent, which means it can safely run multiple times.

You can append your environment after `make`. Like that: `make linux`. <br/>
The following environments are available:

| Command      |                                                                Desciption |
|--------------|--------------------------------------------------------------------------:|
| `make`       |                                                Make a basic installation. |
| `make linux` |                   It basically runs `make` and installs  Linux specifics. |
| `make solus` | It basically runs `make linux` and installs software on Solus after that. |
| `make arch`  |  It basically runs `make linux` and installs software on Arch after that. |
| `make mac`   |          It setups macOS and installs software via `brew` and `brew cask` |

## Making Local Customizations

You can make local customizations for some programs by editing these files:

* `zsh` : `~/.zshrc_local_before` run before `.zshrc`
* `zsh` : `~/.zshrc_local_after` run after `.zshrc`
* `git` : `~/.gitconfig_local`

## Software needed

* `git`
* `zsh`
* `vim`
* `tmux`
* `tree`
* `python3`
* `python3-pip`

## Thanks

- [zsh](https://www.zsh.org/) as being an awesome shell :heart:
- [oh-my-zsh](http://ohmyz.sh/) for the update functionality and plugins :+1:
- [anishs dotfiles](https://github.com/anishathalye/dotfiles) from which I got the inspiration :bulb:
- [dotbot](https://github.com/anishathalye/dotbot) for being an awesome base and pretty extensible! :heart:

## License

Copyright (c) 2016-2018 Niklas Heer.<br/>
Released under the MIT License.<br/>
See [LICENSE][license] for details.<br/>

[dotbot]: https://github.com/anishathalye/dotbot
[license]: LICENSE
