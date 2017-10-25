# Dotfiles

![Screenshot](https://raw.githubusercontent.com/niklas-heer/dotfiles/master/.github/images/zsh_01.png)

After cloning this repo, run `install` to automatically set up the development
environment. Note that the install script is idempotent, which means it can safely run
multiple times.

Dotfiles uses [Dotbot][dotbot] for installation.

This dotfiles are intended to run under an Arch based distro like Antergos or Manjaro.

These dotfiles are inspired by [anishs dotfiles](https://github.com/anishathalye/dotfiles).

## Interesting Links

- https://github.com/anishathalye/dotbot/pull/11#issuecomment-73082152

Software needed
---------------

* `git`, `git-gui`
* `vim`
* `tmux`
* `tree`
* `python3-devel`, `python3-pip` for https://github.com/nvbn/thefuck
* `gcc`

Making Local Customizations
---------------------------

You can make local customizations for some programs by editing these files:

* `zsh` : `~/.zshrc_local_before` run before `.zshrc`
* `zsh` : `~/.zshrc_local_after` run after `.zshrc`
* `git` : `~/.gitconfig_local`

## Install all needed software on Solus

Clone this repo and cd into the directory. Execute this command:

`./install -p dotbot-eopkg/eopkg.py -c .eopkg.conf.yaml`

## Install all needed software on Arch

Clone this repo and cd into the directory. Execute this command:

`./install -p dotbot-yaourt/yaourt.py -c .yaourt.conf.yaml`

## License

Copyright (c) 2016 Niklas Heer. Released under the MIT License. See
[LICENSE][license] for details.

[dotbot]: https://github.com/anishathalye/dotbot
[license]: LICENSE
