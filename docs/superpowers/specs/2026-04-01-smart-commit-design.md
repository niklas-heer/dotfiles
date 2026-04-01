# Smart-Commit & Dev-Tools Framework

## Overview

A Bun-based CLI toolkit in the chezmoi dotfiles repo, with **smart-commit** as the first tool. Tools are discoverable via [television](https://alexpasmantier.github.io/television/) (`tv nht`) and use the Vercel AI SDK with OpenRouter for multi-model LLM calls. Secrets managed by varlock + 1Password.

## Project Structure

```
bin/dev-tools/
├── package.json            # bun project
├── bunfig.toml             # disable bun auto-env loading
├── tsconfig.json
├── .env.schema             # varlock schema (OpenRouter key via 1Password)
├── src/
│   ├── register.ts         # auto-discovers tools, outputs TSV to stdout
│   ├── lib/
│   │   ├── llm.ts          # OpenRouter client setup, model constants
│   │   ├── tools.ts        # reusable tool definitions (git, nushell)
│   │   └── ui.ts           # terminal formatting (colors, tables, prompts)
│   └── smart-commit/
│       ├── index.ts         # entry point
│       └── meta.ts          # { name, description } for tv discovery

dot_config/television/cable/
└── nht.toml                # tv channel: "Niklas Heer Tools"
```

## Tool Discovery

Each tool lives in `src/<tool-name>/` with a `meta.ts` that exports:

```typescript
export default {
  name: "smart-commit",
  description: "Group and commit changes with AI-written messages",
};
```

`register.ts` auto-discovers all `src/*/meta.ts` files and outputs TSV to stdout:

```
smart-commit\tGroup and commit changes with AI-written messages\tbun run ~/bin/dev-tools/src/smart-commit/index.ts
```

The tv channel runs `register.ts` on every invocation — no build step, no static file.

Launcher strategy for v1:

- Keep the Bun project itself in `bin/dev-tools/`
- Let `tv` execute `bun run ...` commands directly for the first version
- Treat `dot_bin/` wrappers as an optional later optimization if startup time, shell ergonomics, or non-`tv` usage justifies stable entrypoints in `~/.bin`

### Television Channel (`nht.toml`)

```toml
[metadata]
name = "nht"
description = "Niklas Heer Tools"

[source]
command = "bun run ~/bin/dev-tools/src/register.ts"
display = "{split:\\t:0|pad:20: :right}{split:\\t:1}"
output = "{split:\\t:2}"

[keybindings]
enter = "actions:run"

[actions.run]
description = "Run the selected tool"
command = "{split:\\t:2}"
mode = "execute"
```

### Shell Aliases

**nushell** (`private_Library/private_Application Support/nushell/config.nu`): `alias nht = tv nht`

**zsh** (`dot_zshrc`): `alias nht='tv nht'`

## Smart-Commit Workflow

Two execution modes are intentionally distinct:

- **Staged mode**: if the user already staged anything, smart-commit operates on the exact staged snapshot in the real index and ignores unstaged edits.
- **Worktree mode**: if nothing is staged, smart-commit operates on all dirty tracked files plus untracked files from the working tree.

Execution must never call `git add` against the user's real index as part of grouping/committing.

### Step 0: Preflight

- Run `git status --porcelain`. If empty, print "Nothing to commit" and exit 0.
- Detect the execution mode:
  - If `git diff --cached --name-only` is non-empty, enter **staged mode** and scope the run to the exact staged contents already present in the index.
  - Otherwise enter **worktree mode** and scope the run to all dirty state.
- Detect binary files via the scoped diff's `--numstat` output (lines show `-\t-` for binary). Exclude binary contents from prompts and include only filenames plus status metadata.
- Record a stable file inventory for the run: path, status (`A/M/D/R`), text vs binary, and source (`index` or `worktree`).

### Step 1: Gather (no LLM)

Collect repo state:

- `git status --porcelain` — all dirty state (modified, untracked, deleted)
- Scoped diffs:
  - **Staged mode**: `git diff --cached --find-renames`
  - **Worktree mode**: `git diff --find-renames`
- `git log --oneline -10` — recent commits for style reference
- Per-file diffs for text files; filenames only for binary files
- For newly added text files:
  - **Staged mode**: read the staged blob from the index, not the working tree copy
  - **Worktree mode**: read the file from disk
- Total diff budget: if combined diffs exceed ~8000 lines, fall back per file in this order: full diff, then trimmed diff, then `--stat` summary. Prefer keeping full diffs for the smallest text files and always preserve filename/status coverage for every scoped file.
- Store a diff fingerprint per scoped file so execution can detect state drift later.

### Step 2: Analyze & Group (`openai/gpt-5.4-mini`)

Send gathered data to a cheap, fast model. The model returns structured output validated by a Zod schema:

```typescript
const CommitGroup = z.object({
  id: z.string(),
  files: z.array(z.string()).min(1),
  reason: z.string().min(1),
  draft_message: z.string().min(1),
});
const CommitPlan = z.array(CommitGroup);
```

Example output:

```json
[
  {
    "files": ["src/lib/auth.ts", "src/lib/auth.test.ts"],
    "reason": "Authentication refactor with tests",
    "draft_message": "refactor(auth): extract token validation"
  },
  {
    "files": ["README.md"],
    "reason": "Documentation update",
    "draft_message": "docs: update auth section"
  }
]
```

Ordering: dependencies first (e.g., library changes before consumers).

Post-parse validation is required before proceeding:

- Every scoped file appears exactly once across the full plan
- No unknown files appear in any group
- No empty groups
- Renames/deletes remain representable by the scoped file inventory

If validation fails, print a concise validation error and exit 1.

### Step 3: Write Messages (`anthropic/claude-sonnet-4.6`)

Send the groups, their diffs, and the commit conventions to a strong writing model. Conventions are hardcoded in the system prompt: conventional commits (`feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`, `perf`, `ci`, `build`) with optional scope. Recent commit history from Step 1 is included as style reference.

The model returns a subject line and optional body per group. Multi-line messages use `git commit -F <tempfile>` to avoid shell escaping issues.

### Step 4: Review (user)

Display all proposed groups with:

- Files in each group
- Diff summary
- Commit message (subject + body)
- Execution mode (`staged` or `worktree`)

User chooses: **[a]pprove all** / **[e]dit** a message / **[s]kip** a group / **[q]uit**

Edit opens `$EDITOR` with the message text.

Known limitation: files cannot be moved between groups or groups merged in this version. The user can skip problematic groups and re-run.

### Step 5: Execute (no LLM)

For each approved group in order:

1. Re-scan the remaining scoped files and compare them to the stored file inventory + diff fingerprints.
2. If any remaining file changed since review, stop before the next commit and tell the user to re-run. This includes hook-driven rewrites from earlier commits.
3. Create a fresh temporary index rooted at the current `HEAD`.
4. Materialize only the current group's snapshot into that temp index:
   - **Staged mode**: copy the exact staged blobs for the group's files from the real index into the temp index. Never re-stage from the working tree.
   - **Worktree mode**: add only the group's current working tree changes into the temp index.
5. Commit using the temp index and the reviewed message:

```bash
GIT_INDEX_FILE=$tmp_index git commit -F <tempfile>
```

6. Delete the temp index and continue with the next group.

The user's real index must remain untouched throughout execution.

If a commit fails (for example, pre-commit hook rejection), stop execution, print which groups succeeded and which failed, and exit with non-zero status. The user can inspect the partial state and re-run for remaining changes.

Print summary of all commits made.

## Error Handling

- **No changes**: exit 0 with message (preflight check)
- **LLM API failure** (network, rate limit, 500): print error, exit 1. No retry — user can re-run.
- **Malformed or invalid LLM output**: Zod validation and plan validation catch schema mismatches, dropped files, duplicate files, and unknown files. Print the validation failure and raw output for debugging, exit 1.
- **Git commit failure**: stop at the failing group, report what succeeded vs. failed, exit 1.
- **Repo state changed during execution**: abort before the next commit, explain which files drifted, exit 1.
- **Binary files**: excluded from diffs, included as filenames only.
- **Large diffs**: truncated with stat summaries to stay within context budget.

## Dependencies

| Package | Purpose |
|---|---|
| `ai` | Vercel AI SDK core |
| `@ai-sdk/openai` | OpenAI-compatible provider (OpenRouter) |
| `zod` | Tool/schema validation |
| `varlock` | Env var management |
| `@varlock/1password-plugin` | 1Password secret backend |

## Secrets Management

### `.env.schema`

```bash
# @plugin(@varlock/1password-plugin)
# @initOp(allowAppAuth=true)
# ---

# @required @sensitive
# @docs(https://openrouter.ai/docs/api-keys)
OPENROUTER_API_KEY=op(op://Personal/openrouter (dotfiles tools)/credential)
```

- `allowAppAuth=true` uses the 1Password desktop app with biometric unlock
- `bunfig.toml` sets `env = false` to prevent Bun from auto-loading `.env`
- Scripts use `import 'varlock/auto-load'` to resolve secrets at startup

## Models

| Step | Model | Why |
|---|---|---|
| Analyze & Group | `openai/gpt-5.4-mini` (OpenRouter) | Cheap, fast, strong tool use |
| Write Messages | `anthropic/claude-sonnet-4.6` (OpenRouter) | Best prose quality |

## Chezmoi Integration

| Source path | Target |
|---|---|
| `bin/dev-tools/` | `~/bin/dev-tools/` |
| `dot_config/television/cable/nht.toml` | `~/.config/television/cable/nht.toml` |
| `dot_zshrc` (alias addition) | `~/.zshrc` |
| `private_Library/private_Application Support/nushell/config.nu` (alias addition) | nushell config |

Notes:

- This repo now prefers small user-facing executables in `dot_bin/`, which land in `~/.bin`
- That does not replace `bin/dev-tools/`; it only affects whether tools also get stable wrapper commands later
- For v1, no wrapper in `dot_bin/` is required for `smart-commit`

### Ignore rules

Add to `.chezmoiignore`:
- `bin/dev-tools/node_modules/**`
- `bin/dev-tools/.env`

Do **not** ignore `docs/**` unless the design docs are intentionally meant to stay local-only and out of chezmoi management.

### Dependency installation

A `run_onchange_` script (keyed on `package.json` and lockfile content hash) runs `bun install --cwd ~/bin/dev-tools/` after chezmoi apply.

## CLI Flags

- `--dry-run` — run Steps 1-4 but skip Step 5 (no commits made)

## Implementation Checklist

### Phase 1: Scaffold the dev-tools workspace

- Create `bin/dev-tools/package.json`, `tsconfig.json`, `bunfig.toml`, and `.env.schema`
- Add dependencies: `ai`, `@ai-sdk/openai`, `zod`, `varlock`, `@varlock/1password-plugin`
- Create `src/register.ts`, `src/lib/llm.ts`, `src/lib/ui.ts`, and `src/lib/git.ts`
- Create `src/smart-commit/index.ts` and `src/smart-commit/meta.ts`
- Add `dot_config/television/cable/nht.toml`
- Add `nht` aliases to [dot_zshrc](/Users/nheer/.local/share/chezmoi/dot_zshrc) and [config.nu](/Users/nheer/.local/share/chezmoi/private_Library/private_Application%20Support/nushell/config.nu)
- Add `.chezmoiignore` entries for `bin/dev-tools/node_modules/**` and `bin/dev-tools/.env`
- Add a `run_onchange_` script for `bun install --cwd ~/bin/dev-tools/`
- Keep launchers as direct `bun run` commands in `tv` for v1; do not add `dot_bin/` wrappers yet

Acceptance checks:

- `bun run ~/bin/dev-tools/src/register.ts` prints TSV rows for discovered tools
- `tv nht` shows `smart-commit`
- `bun run ~/bin/dev-tools/src/smart-commit/index.ts --help` exits successfully
- The implementation does not depend on a wrapper command in `~/.bin`

### Phase 2: Implement repo scanning and prompt inputs

- Detect execution mode: staged vs worktree
- Build the scoped file inventory with status, binary/text classification, and source
- Collect scoped diffs with rename detection
- Read newly added text files from the correct source: index in staged mode, disk in worktree mode
- Implement diff budgeting and truncation fallback
- Generate per-file diff fingerprints for later drift detection

Acceptance checks:

- Empty repo state prints `Nothing to commit` and exits 0
- Partially staged files remain represented from the staged snapshot only
- Binary files appear by filename/status only
- Large diffs degrade to trimmed diff or stat output without dropping files from scope

### Phase 3: Implement grouping and message generation

- Define the Zod schemas for commit groups and final messages
- Build the grouping prompt for `openai/gpt-5.4-mini`
- Add post-parse validation for exact file coverage, no duplicates, and no unknown files
- Build the message-writing prompt for `anthropic/claude-sonnet-4.6`
- Include recent commit history as style reference

Acceptance checks:

- Invalid model output fails fast with a readable validation error
- A valid plan covers every scoped file exactly once
- Message generation produces subject-only and subject+body cases correctly

### Phase 4: Implement interactive review

- Render grouped files, diff summaries, messages, and execution mode in the terminal UI
- Support approve-all, edit, skip, and quit actions
- Open `$EDITOR` for message edits and read the edited result back in
- Preserve skipped groups as uncommitted state

Acceptance checks:

- Editing a message changes only that group's commit text
- Skipped groups are omitted from execution
- `--dry-run` performs review without creating commits

### Phase 5: Implement temp-index execution

- Re-scan remaining files before each commit and compare against stored fingerprints
- Abort on drift before creating the next commit
- Create a temp index rooted at `HEAD`
- In staged mode, copy exact staged blobs from the real index into the temp index
- In worktree mode, stage only the current group's worktree snapshot into the temp index
- Commit with `GIT_INDEX_FILE=$tmp_index git commit -F <tempfile>`
- Clean up temp files and temp indexes after each group

Acceptance checks:

- The user's real index is unchanged after a successful run in staged mode
- Hook-driven rewrites cause a controlled abort before later commits
- A failing commit reports completed groups and leaves remaining work untouched

### Phase 6: Add tests and fixtures

- Add fixture repos or scripted test cases for:
  - no changes
  - staged mode
  - worktree mode
  - partially staged files
  - untracked files
  - binary files
  - rename/delete handling
  - drift after first commit
  - commit hook failure
- Add focused tests for plan validation and diff budgeting helpers

Acceptance checks:

- Core helper logic runs under automated tests
- Manual end-to-end test passes in this chezmoi repo without mutating unrelated staged state

### Phase 7: Hardening and polish

- Improve terminal formatting and summaries
- Add explicit error messages for missing `OPENROUTER_API_KEY`, missing `git`, and missing `$EDITOR`
- Add logging or debug output behind a verbose flag if needed
- Document operational limits and known non-goals

Acceptance checks:

- Failure modes are actionable without reading source code
- The tool is usable from `tv nht` and directly from the shell

## Adding a New Tool

1. Create `src/<tool-name>/index.ts` and `src/<tool-name>/meta.ts`
2. `meta.ts` exports `{ name, description }`
3. Done — `nht` picks it up on next invocation
