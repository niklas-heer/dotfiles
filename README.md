Dotfiles
========

After cloning this repo, run `install` to automatically set up the development
environment. Note that the install script is idempotent: it can safely be run
multiple times.

Dotfiles uses [Dotbot][dotbot] for installation.

These dotfiles are inspired by [anishs dotfiles](https://github.com/anishathalye/dotfiles).

## Interesting Links

- https://github.com/anishathalye/dotbot/pull/11#issuecomment-73082152

Software needed
---------------

* `git`, `git-gui`
* `vim`
* `tmux`
* `python3-devel`, `python3-pip` for https://github.com/nvbn/thefuck
* `gcc` (for openSUSE: `sudo zypper in -t pattern devel_basis`)
* `ksshaskpass`

Making Local Customizations
---------------------------

You can make local customizations for some programs by editing these files:

* `zsh` : `~/.zshrc_local_before` run before `.zshrc`
* `zsh` : `~/.zshrc_local_after` run after `.zshrc`
* `git` : `~/.gitconfig_local`


License
-------

Copyright (c) 2016 Niklas Heer. Released under the MIT License. See
[LICENSE.md][license] for details.

[dotbot]: https://github.com/anishathalye/dotbot
[license]: LICENSE.md
