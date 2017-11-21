# shellcheck disable=SC2148

# Source a file if it exists
include() {
	# shellcheck source=/dev/null
	[[ -f "$1" ]] && source "$1"
}

# Allow local customizations in the ~/.zshrc_local_before file
include ~/.zshrc_local_before

# Load main configuration
include ~/.zsh/master/main.zsh

# Allow local customizations in the ~/.zshrc_local_after file
include ~/.zshrc_local_after

# Fzf settings - do not change position!
[ -f ~/.fzf.zsh ] && include ~/.fzf.zsh
