from pyinfra.operations import brew, server

#fix scrolling
# defaults write -g com.apple.swipescrolldirection -bool NO
#

apps = ["zed", "arc", "ghostty", "1password", "1password-cli", "rocket", "raycast"]
fonts = ["font-cascadia-code-nf", "font-jetbrains-mono-nerd-font", "font-monaspace-nerd-font", "font-victor-mono-nerd-font", "font-victor-mono"]
clis = ["nushell", "m-cli", "gitmoji", "lazygit", "lazydocker", "ghq", "fzf", "oh-my-posh"]

def install_summary(desc, list):
    print(f"\n--> Installing {desc}: {', '.join(list)}")

def install_casks(desc, apps):
    install_summary(desc, apps)
    brew.casks(name=f"Brew install {desc} (casks)", casks=apps, upgrade=True, latest=True,)

def install_pkgs(desc, apps):
    install_summary(desc, apps)
    brew.packages(name=f"Brew install {desc}", packages=apps, upgrade=True, latest=True,)

install_casks("desktop apps", apps)
install_casks("fonts", fonts)
install_pkgs("cli apps", clis)

server.shell(
    name="Setting up ghq directiories.",
    commands=['zsh -c "mkdir -p $HOME/Projects/{test,github.com}"'],
)

# tell to restart
