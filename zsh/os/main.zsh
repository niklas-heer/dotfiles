# shellcheck disable=SC2148
#####################
# Load OS specials
#####################

# This provides commands for the specific OS which is in use.

if [[ $(uname) == 'Darwin' ]]; then
	# MacOS
	include "$HOME/.zsh/os/mac.zsh"
else
	# Load general linux configs
	include "$HOME/.zsh/os/linux.zsh"

	if [ -f /etc/arch-release ] || [ -f /etc/manjaro-release ]; then
		# arch/manjaro/antergos
		include "$HOME/.zsh/os/arch.zsh"
	elif [ -f /etc/solus-release ]; then
		# Solus
		include "$HOME/.zsh/os/solus.zsh"
	elif [ -f /etc/lsb-release ]; then
		# Ubuntu
		include "$HOME/.zsh/os/ubuntu.zsh"
	fi
fi
