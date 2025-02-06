from pyinfra.operations import brew, server

# Desktop apps
apps = [
    # My main editor
    "zed",
    # Main browser
    "arc",
    # My terminal
    "ghostty",
    # My password manager
    "1password",
    "1password-cli",
    # My spotlight replacement and more
    "raycast",
    # This let's me get a lot of paid apps with one subscirption
    "setapp",
]

# Cli apps
clis = [
    # My main shell
    "nushell",
    # For having emojis in git commit messages
    "gitmoji",
    # Great cli client for git
    "lazygit",
    # Great cli client for docker
    "lazydocker",
    # My tool to download git repos in a structured way
    "ghq",
    # Fuzzy finder I use to find everything
    "fzf",
    # My prompt theme engine for nu and zsh
    "oh-my-posh",
    # multi-shell completion library so nu is more useful
    "carapace",
    # replaces make for me with saner syntax
    "just",
    # replaces cat for me as it does syntax highlighting
    "bat",
    # replaces httpie for interacting with APIs
    "xh",
]

# Fonts I use
# TODO: Add MonoLisa as my main font
fonts = ["font-jetbrains-mono-nerd-font", "font-victor-mono-nerd-font"]

def install_summary(desc, list):
    print(f"    Installing {desc}: {', '.join(list)}")

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
