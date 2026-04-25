# nht Python Spike

This is a focused spike for the `decision` flow using:

- `prompt_toolkit` for inline-friendly multiline editing and confirmation
- `rich` for readable review output
- `uv` for environment and dependency management
- `ruff` and `ty` for linting and static analysis

## Run

```bash
uv run decision-spike
```

## What it tests

- Inline multiline editing without swapping to the terminal alternate screen
- Real cursor movement and paste handling
- A review step that stays in the normal terminal flow
- A typed Python codepath that can be compared directly against the Bun / OpenTUI version
