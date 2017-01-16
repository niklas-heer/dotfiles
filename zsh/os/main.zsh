# This provides commands for the specific OS which is in use.

if [ -f /etc/arch-release ]; then
    # arch/manjaro/antergos
    source ~/.zsh/os/arch.zsh
elif [ -f /etc/solus-release ]; then
    # Solus
    source ~/.zsh/os/solus.zsh
fi
