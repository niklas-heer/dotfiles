# shellcheck disable=SC2148
###################
# Antigen
###################

include ~/.zsh/antigen/antigen.zsh

# Load the oh-my-zsh's library.
antigen use oh-my-zsh

# Bundles from the default repo (robbyrussell's oh-my-zsh).
antigen bundle git
antigen bundle pip
antigen bundle command-not-found
antigen bundle history
antigen bundle history-substring-search
antigen bundle jump
antigen bundle sudo
antigen bundle man
antigen bundle zsh-navigation-tools
antigen bundle docker
antigen bundle docker-compose
#antigen bundle autojump # https://github.com/wting/autojump

# Syntax highlighting bundle.
antigen bundle zsh-users/zsh-syntax-highlighting

if [[ $(uname) == 'Darwin' ]]; then
	# macOS
	if [[ -n "$TERM_EMULATOR" ]] && [[ "$TERM_EMULATOR" == 'vscode' ]]; then
		# We are running in Visual Studio Code
		export POWERLEVEL9K_MODE='awesome-patched';
	else
		# We are running in iTerm or something else
		export POWERLEVEL9K_MODE='nerdfont-complete'   # https://github.com/ryanoasis/nerd-fonts
	fi
else
	# Linux
	# Set the right font: https://github.com/gabrielelana/awesome-terminal-fonts
	export POWERLEVEL9K_MODE='awesome-patched'
fi

# Load the theme.
antigen theme denysdovhan/spaceship-prompt spaceship

# Tell antigen that you're done.
antigen apply
