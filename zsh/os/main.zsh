#####################
# Load OS specials
#####################

# This provides commands for the specific OS which is in use.

if [[ $(uname) == 'Darwin' ]]; then
	# MacOS
	source "$HOME/.zsh/os/mac.zsh"
else
	# Linux
	if [ -f /etc/arch-release ] || [ -f /etc/manjaro-release ]; then
		# arch/manjaro/antergos
		source "$HOME/.zsh/os/arch.zsh"
	elif [ -f /etc/solus-release ]; then
		# Solus
		source "$HOME/.zsh/os/solus.zsh"
	elif [ -f /etc/lsb-release ]; then
		# Ubuntu
		source "$HOME/.zsh/os/ubuntu.zsh"
	fi
fi
