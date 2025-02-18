# docs: https://github.com/Homebrew/homebrew-bundle
# tips: https://gist.github.com/ChristopherA/a579274536aab36ea9966f301ff14f3f
#
# `brew bundle install`
# -> Looks for ~/Brewfile and installs its contents

tap "oven-sh/bun" # https://github.com/oven-sh/homebrew-bun
tap "d12frosted/emacs-plus" # https://github.com/d12frosted/homebrew-emacs-plus

# CLI apps
brew "nushell" # shell replaces bash/zsh and more
brew "gitmoji" # getting emojis for commit messages
brew "lazygit" # cli client for git
brew "lazydocker" # cli client for docker
brew "ghq" # download and manage git repos Golang style
brew "fzf" # fuzzy finder
brew "oh-my-posh" # prompt engine for nu and zsh
brew "carapace" # multi-shell completion library (for nushell)
brew "just" # better Makefiles
brew "bat" # better cat
brew "xh" # better httpie - interact with APIs (get, post, ...)
brew "bun" # better nodejs
brew "docker" # containers ftw 😅
brew "colima" # running Docker on MacOS
brew "fd" # better find
brew "sd" # better sed to replace stuff
brew "eza" # better ls to list stuff
brew "ripgrep" # better grep, also needed for Doom Emacs

# Emacs Plus
# see: https://github.com/d12frosted/homebrew-emacs-plus?tab=readme-ov-file#gccemacs
# problems: https://github.com/d12frosted/homebrew-emacs-plus?tab=readme-ov-file#gccemacs
brew "emacs-plus", args: ["with-native-comp", "with-c9rgreen-sonoma-icon"]
brew "gcc" # to fix Emacs native-comp
brew "libgccjit" # to fix Emacs native-comp

# Desktop apps
cask "zed" # editor of choice over vscode
cask "arc" # browser
cask "ghostty" # terminal
cask "1password" # password manager
cask "1password-cli" # to use password manager in cli
cask "raycast" # productivity replaces Alfred and Spotlight, config synced via cloud
cask "setapp" # subscription service for some paid apps
cask "hammerspoon" # powerful automation with Lua (e.g. shortcuts or global mute)
cask "amethyst" # tiling window manager similar to xmonad

# Fonts
# TODO: Add MonoLisa as my main font
cask "font-symbols-only-nerd-font" # for Doom Emacs icon support
cask "font-jetbrains-mono-nerd-font" # most practical font
