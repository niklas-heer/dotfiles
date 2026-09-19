# Testing

Niklas prefers fast feedback, fast software execution, and end-to-end evidence that the tool really works.

- Favor tests of observable behavior through the actual public entry point: CLI invocation, API, or user workflow as appropriate. Check meaningful outputs, persisted state, and failure behavior, not merely a successful exit.
- Keep end-to-end checks small, isolated, reproducible, and quick. Add focused unit or property tests where they cover edge cases more cheaply; the end-to-end preference is not a ban on other tests.
- Avoid tests that only restate the implementation. Match verification to the risk and change; small prose edits do not need a software test suite.
- Use targeted checks during iteration and run the project's required checks before completion. Broaden or repeat only when changes, failures, or unresolved concerns justify it.
- Treat test duration and application runtime as separate concerns. Measure relevant performance when making performance claims; do not make tests fast by removing useful coverage.
- For stateful tools, persistence, recovery, retries, or long action sequences, evaluate [deterministic simulation](simulation.md) as a way to build confidence before a project has many real users.
