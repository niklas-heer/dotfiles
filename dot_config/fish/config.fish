# Interactive Fish configuration managed by chezmoi.

set -g fish_greeting
set -g fish_autosuggestion_enabled 1

set -gx EDITOR nvim
set -gx VISUAL nvim
set -gx CARAPACE_BRIDGES zsh,fish,bash,inshellisense

# Keep PATH behavior aligned with zsh, Nushell, and xonsh.
fish_add_path --prepend /opt/homebrew/bin /opt/homebrew/sbin
fish_add_path --prepend $HOME/bin $HOME/.bin
fish_add_path --append $HOME/.bun/bin $HOME/.cargo/bin $HOME/go/bin
fish_add_path --append $HOME/.local/bin /usr/local/bin

# Tokyo Night Storm palette.
set -g fish_color_normal c0caf5
set -g fish_color_command 7aa2f7
set -g fish_color_keyword bb9af7 --bold
set -g fish_color_quote 9ece6a
set -g fish_color_redirection 7dcfff
set -g fish_color_end ff9e64
set -g fish_color_error f7768e --bold
set -g fish_color_param c0caf5
set -g fish_color_option e0af68
set -g fish_color_comment 565f89 --italics
set -g fish_color_selection c0caf5 --background=33467c
set -g fish_color_search_match c0caf5 --background=33467c
set -g fish_color_operator 89ddff
set -g fish_color_escape bb9af7
set -g fish_color_autosuggestion 565f89
set -g fish_color_cwd 7dcfff
set -g fish_color_cwd_root f7768e
set -g fish_color_valid_path --underline

# Tokyo Night completion pager.
set -g fish_pager_color_background --background=1a1b26
set -g fish_pager_color_prefix 7aa2f7 --bold
set -g fish_pager_color_completion c0caf5
set -g fish_pager_color_description 565f89
set -g fish_pager_color_progress 565f89
set -g fish_pager_color_secondary_background --background=1e2030
set -g fish_pager_color_selected_background --background=33467c
set -g fish_pager_color_selected_prefix 7aa2f7 --bold
set -g fish_pager_color_selected_completion c0caf5
set -g fish_pager_color_selected_description 7dcfff

status is-interactive; or return

# Rich cross-shell completions for commands not covered by Fish itself.
if type -q carapace
    carapace _carapace | source
end

if type -q zoxide
    zoxide init fish | source
end

if type -q atuin
    atuin init fish --disable-up-arrow | source
end

# Use the same prompt configuration as zsh, Nushell, and xonsh.
if type -q oh-my-posh
    oh-my-posh init fish --config $HOME/.nheer.omp.yaml | source
end

# Frequently used shortcuts shared with the other shells.
abbr --add --global z 'zed .'
abbr --add --global ai 'codex --dangerously-bypass-approvals-and-sandbox'
abbr --add --global newproj 'np new'
abbr --add --global graduateproj 'np promote'

alias lg lazygit
alias m-open open

# Apply user bindings after integrations so they cannot replace our Tab mode.
fish_user_key_bindings
