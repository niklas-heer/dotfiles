# shellcheck disable=SC2148
###################
# Update
###################

# Check for updates on initial load...
if [ "$DISABLE_AUTO_UPDATE" != "true" ]; then
	env DOTFILES="$DOTFILES" DISABLE_UPDATE_PROMPT="$DISABLE_UPDATE_PROMPT" zsh -f "$DOTFILES"/tools/check_for_update.sh
fi
