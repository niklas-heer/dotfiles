from pyinfra.operations import brew, server

#fix scrolling
# defaults write -g com.apple.swipescrolldirection -bool NO
#

apps = ["zed", "arc", "ghostty", "1password", "1password-cli"]
clis = ["nushell", "m-cli", "gitmoji", "lazygit", "lazydocker", "ghq", "fzf"]

def install_summary(desc, list):
    print(f"\n--> Installing {desc}: {', '.join(list)}")

def install_desktop_apps(desktop_apps):
    install_summary("desktop apps", desktop_apps)
    brew.casks(name="Brew install casks...", casks=desktop_apps, upgrade=True, latest=True,)

def install_cli_apps(cli_apps):
    install_summary("cli apps", cli_apps)
    brew.packages(name="Brew install...", packages=cli_apps, upgrade=True, latest=True,)

install_desktop_apps(apps)
install_cli_apps(clis)

server.shell(
    name="Setting up ghq directiories.",
    commands=['zsh -c "mkdir -p $HOME/Projects/{test,github.com}"'],
)

# install system packages
# what about Xcode tools?


# tell to restart
