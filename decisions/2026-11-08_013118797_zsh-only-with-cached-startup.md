+++
schema_version = 1
id = "01M6WCG1CDMPXPJP519N3B7BMS"
title = "Zsh only, with cached startup"
date = "2026-11-08"
status = "accepted"
tags = ["shell", "performance"]
related_to = ["01M2XHZ9ET3D2R1JR78PQ7K2ZQ"]
+++

## Decision

Zsh is the only shell this setup configures. Ghostty, cmux, otty and Zed start /bin/zsh; the Nushell, Fish and xonsh configurations and Homebrew packages are removed; and the single Ghostty config lives at ~/.config/ghostty/config. Startup stays fast by inlining Homebrew's environment in ~/.zprofile, caching every tool's `init zsh` snippet to ~/.cache/zsh/init keyed by the binary's resolved path, and autoloading the np, nht and homelab helpers from ~/.config/zsh/functions.

## Why

After standardizing on zsh in August 2026 the other shells stayed around for experimentation, yet an unmanaged ~/.config/ghostty/config still launched Nushell in Ghostty and cmux, because cmux reads only that XDG file and Ghostty lets it win when the Application Support copy drifts. Two Ghostty config locations invited exactly this drift. The old ~/.zshrc also spawned eight tools at every start, about 95 ms, when their output changes only on upgrade. Measured after the change: about 30 ms for a login shell, most of it zsh-autocomplete itself.

## Consequences

- Every terminal opens zsh with the same prompt, completions and history, and a config change applies to Ghostty and cmux at once.
- A tool upgrade regenerates its cache automatically; a cache that is somehow stale is fixed by deleting ~/.cache/zsh/init.
- Homebrew's paths are hard-coded for Apple silicon; an Intel Mac would need /usr/local in ~/.zprofile.
- The experimental shell configurations are gone from the dotfiles and must be rebuilt from Git history if wanted again.

This refines [Standardizing on zsh](2026-08-15_192328602_standardizing-on-zsh.md): zsh stays the standard shell, but the alternative shell configurations that record chose to keep are removed.
