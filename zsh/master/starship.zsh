# shellcheck disable=SC2148
###################
# Starship
###################

# Starship is a cross shell prompt written in Rust.
# Website: https://github.com/starship/starship

# Initialize it
eval "$(starship init zsh)"

# Set the correct configuration file
export STARSHIP_CONFIG="$HOME/.dotfiles/starship.toml"
