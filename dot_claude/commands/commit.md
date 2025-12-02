---
description: Create a conventional commit from staged changes.
---
Analyze all changes and create well-organized commits, grouping related changes together.

**Steps**

1. Run `git status` to see all changes (staged, unstaged, untracked)
2. Run `git diff` and `git diff --cached` to understand what changed
3. Analyze the changes and group them logically (see grouping rules below)
4. For each logical group:
   - Stage only the files belonging to that group with `git add <files>`
   - Run validation checks based on file types (see validation rules below)
   - If validation fails, fix the issues and re-stage
   - Run `git log --oneline -10` to understand commit style (first iteration only)
   - Create a conventional commit for that group
5. Repeat until all changes are committed

**Validation Rules**

Before committing, run validation based on the file types present. Only run checks for tools that exist in the project:

- **Go**: `go fmt`, `go vet`, `go test`
- **TypeScript/JavaScript**: `npm test`, `npm run lint` (if package.json exists)
- **Python**: `pytest`, `ruff` or `flake8` (if configured)
- **Rust**: `cargo test`, `cargo clippy`

**Validation Failure Handling**:
- Formatting issues: Fix automatically and re-stage
- Lint warnings: Fix automatically where possible
- Test failures: Analyze and fix the root cause
- If a fix is complex or unclear, ask the user before proceeding

**Grouping Rules**

Group changes that belong together semantically:

- **Feature + Tests**: Implementation files with their corresponding test files
- **Refactor**: Related refactoring changes across multiple files
- **Config changes**: Build configs, CI files, dependencies
- **Documentation**: README, docs/, comments-only changes
- **Bug fix**: The fix and any related test additions
- **Single responsibility**: Each commit should do ONE thing

**Examples of Good Grouping**

- `feat(parser): add support for nested lists` - parser files + tests
- `chore: update dependencies` - dependency files only
- `docs: add examples to README` - documentation only
- `fix(ui): resolve cursor positioning bug` - fix + related tests
- `refactor: extract validation logic` - related refactoring across files

**Examples of Bad Grouping**

- Mixing a bug fix with an unrelated new feature
- Combining dependency updates with code changes
- Docs changes mixed with implementation changes

**Safety**

- Before adding, check for files that should NOT be committed (secrets, .env files, large binaries)
- If suspicious files are found, warn the user and exclude them
- Respect .gitignore
- If unsure whether changes belong together, ask the user

**Conventional Commit Format**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring without behavior change
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `perf`: Performance improvements

Include scope in parentheses when applicable: `feat(auth): add login flow`
Include breaking change footer (`BREAKING CHANGE:`) if applicable.
