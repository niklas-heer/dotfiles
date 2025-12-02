---
description: Add a new decision to a decision log file.
---
Add a new decision entry to the specified file's decision log.

**Arguments**: $ARGUMENTS (format: "file path | decision title | brief description")

If no arguments provided, ask the user for:
1. The file path containing the decision log
2. The decision title (short, descriptive)
3. A brief description of what was decided and why

**Steps**

1. Read the target file to find the decision log section
2. Find the marker `<!-- DECISION LOG START -->` 
3. Determine the next decision number by finding the highest existing number and adding 1
4. Ask the user clarifying questions to gather:
   - **Status**: What is the status? Options:
     - ✅ Adopted (accepted and in use)
     - ✅ Accepted (decision made but not yet implemented)
     - ⛔ Deprecated by [X Title](#x-title) (replaced by another decision)
     - ⬆️ Supersedes [X Title](#x-title) (replaces a previous decision)
   - **Decision**: What exactly did you decide? (one clear sentence starting with "I will...")
   - **Context**: Why did you make this decision? What alternatives did you consider?
   - **Consequences**: What follows from this decision? What will you need to do?
5. Format the new entry and insert it right after `<!-- DECISION LOG START -->`

**Decision Entry Format**

```markdown

### {number} {Title}
* **Status**: {status}
* **Decision**: {decision}
* **Context**: {context}
* **Consequences**: {consequences}
```

**Example Entry**

```markdown

### 14 Adopting Helix
* **Status**: ✅ Adopted
* **Decision**: I will use `Helix` as my terminal-based editor instead of Neovim.
* **Context**: Helix has great defaults out of the box, uses Tree-sitter for syntax highlighting, and has a modal editing model similar to Kakoune that I find intuitive. Unlike Neovim, I don't need to spend hours configuring plugins.
* **Consequences**: I need to learn Helix keybindings and write minimal configuration.
```

**Guidelines**

- Keep the decision statement concise and actionable (start with "I will...")
- Context should explain the reasoning and alternatives considered
- Consequences should be practical and specific
- Use backticks for tool/technology names
- Link to related decisions when using Supersedes or Deprecated status
