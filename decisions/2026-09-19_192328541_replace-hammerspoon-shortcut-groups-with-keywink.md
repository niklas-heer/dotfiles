+++
schema_version = 1
id = "01M2XHZ9CX2N3GD2ZNJXD5BCRE"
title = "Replace Hammerspoon shortcut groups with Keywink"
date = "2026-09-19"
status = "accepted"
tags = ["shell"]
supersedes = []
superseded_by = []
depends_on = []
related_to = []
+++
* **Status**: 🧪 Trial; intended to supersede [11 Adopting Hammerspoon](2025-02-12_192328634_adopting-hammerspoon.md) after live verification
* **Decision**: I will use Keywink for the five Hyper-key shortcut groups previously implemented as Hammerspoon modals.
* **Context**: Keywink now supports direct shortcuts to root groups and can reproduce the existing application, Raycast, CleanShot, Todoist, and custom-function mappings. The configuration belongs in chezmoi at `~/.config/keywink/config.json`; `setup-keywink-shortcuts` recreates Hyper-G/R/S/T/F without defining a separate root shortcut.
* **Verification**: The configuration, shortcut preference values, script syntax (including embedded AppleScript), and SF Symbol names were checked statically. The managed files and preferences were applied, Keywink loaded all five groups, and its application guide was inspected. Hammerspoon was quit for the trial. Physical shortcut use and custom-action behavior still need live verification.
* **Consequences**: The 26 actions and their labels are managed declaratively. Three native macOS scripts replace the selected-text speech, presentation resize, and Amethyst floating functions; they can require Automation and Accessibility permission on first use. Premium Anna and Jamie voices and Amethyst must be installed, and the Slack action requires `/Applications/Slack.app`. The old Hammerspoon configuration remains in source for rollback while this migration is verified. The trial only quits the current Hammerspoon process; it does not remove Hammerspoon, disable its login launch, or alter its configuration.
