# Claude Code Guidelines

This is a chezmoi-managed dotfiles repository for macOS.

## Repository Structure

- `dot_*` files/folders → installed to `~/.{name}` (e.g., `dot_config` → `~/.config`)
- `private_*` → files with restricted permissions
- `run_once_*` → scripts that run once during setup
- `run_onchange_*` → scripts that run when their content changes
- `*.tmpl` → chezmoi templates (use `{{ }}` for variables)
- `Brewfile` → Homebrew packages to install

## Key Technologies

- **chezmoi**: Dotfile manager (source of truth is this repo, target is `~`)
- **nushell**: Primary shell (zsh kept as login shell for compatibility)
- **Ghostty**: Terminal emulator
- **Zed**: Primary editor
- **Hammerspoon**: Keyboard shortcuts and automation (Lua config)
- **oh-my-posh**: Prompt theme engine

## Conventions

### Commit Messages
Use conventional commits: `feat`, `fix`, `docs`, `refactor`, `chore`
Include scope when relevant: `feat(zed): add new keybinding`

### Decision Log
Major tool/approach decisions are documented in `README.md` under "Project decision log".
Use `/decision` command to add new entries.

Format:
```markdown
### {number} {Title}
* **Status**: ✅ Adopted | ⛔ Deprecated by [X] | ⬆️ Supersedes [X]
* **Decision**: I will...
* **Context**: Why, what alternatives considered
* **Consequences**: What follows from this
```

### Adding New Tools
1. Add to `Brewfile` if installable via Homebrew
2. Add config to appropriate `dot_config/{tool}/` directory
3. Use `.tmpl` extension if config needs secrets (via 1Password: `{{ onepasswordDetailsFields ... }}`)
4. Document the decision in the decision log if it's a significant choice

## Files to Ignore
- `.DS_Store` files (already in `.gitignore`)
- Secrets should use chezmoi templates with 1Password, never commit plaintext
- `README.md` and `todo.md` are not deployed (listed in `.chezmoiignore`)

## Testing Changes
```bash
chezmoi diff    # Preview what would change
chezmoi apply   # Apply changes to home directory
```
