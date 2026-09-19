# Rust project review guidance

Provided by Niklas on 2026-09-19. Use these recommendations when creating, reviewing, or improving a Rust project, but apply them only where they provide a concrete benefit. Nix/devenv recommendations were explicitly excluded. Read [tooling.md](tooling.md) for mise preferences and [testing.md](testing.md) for fast end-to-end validation and conditional simulation testing.

The existing project is authoritative. Inspect its `Cargo.toml`, lockfile, toolchain, MSRV, CI, tests, lint configuration, architecture, and conventions before making changes. Do not blindly install every tool or crate listed here.

## General rules

- Preserve the project's existing Rust toolchain and MSRV unless there is a justified reason to change them.
- Prefer stable Rust. Use nightly only when the project needs a nightly feature or receives a demonstrated benefit; pin it in `rust-toolchain.toml`.
- Prefer the standard library and existing dependencies before adding another crate.
- Keep dependency features minimal and avoid duplicate libraries serving the same purpose.
- Distinguish application dependencies from developer tools. Tools such as Bacon, `cargo-nextest`, and `cargo-generate` generally do not belong in `[dependencies]`.
- Do not perform an unrelated dependency or lockfile update.
- Never commit credentials, tokens, production URLs, or other secrets in configuration, `.env`, or source files.
- Make the smallest coherent change, run the relevant checks, and explain what was added, omitted, and why.

## Recommended baseline

Check whether the project has an effective setup for:

- `rustfmt` for formatting
- Clippy for static analysis
- Rust Analyzer for editor support
- Unit, integration, and documentation tests
- CI checks for formatting, compilation, linting, and tests
- A documented local development workflow

Useful verification commands include (prefix shell invocations with `rtk` where installed):

```sh
cargo fmt --all -- --check
cargo check --all-targets --all-features
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
cargo test --doc
```

Use narrower commands if some features are mutually exclusive or require unavailable external services.

## Clippy policy

Consider enabling the `pedantic` and `nursery` lint groups, preferably incrementally on an established codebase. Candidate production-code restrictions include:

```toml
[lints.clippy]
pedantic = { level = "deny", priority = -1 }
nursery = { level = "deny", priority = -1 }

unwrap_used = "deny"
expect_used = "deny"
indexing_slicing = "deny"
arithmetic_side_effects = "deny"
unreachable = "deny"
unimplemented = "deny"
unchecked_time_subtraction = "deny"
todo = "deny"
string_slice = "deny"
panic_in_result_fn = "deny"
panic = "deny"
exit = "deny"
as_conversions = "deny"
```

These lints are deliberately strict. Enable only those compatible with the project, and avoid large mechanical rewrites with little safety benefit.

Fast prototyping in tests may be supported through `clippy.toml`:

```toml
allow-unwrap-in-tests = true
allow-expect-in-tests = true
allow-panic-in-tests = true
allow-indexing-slicing-in-tests = true
```

Do not weaken production checks merely to silence warnings. Fix the underlying issue or add a narrowly scoped, documented allowance.

## Development and test tools

Consider these when they improve the existing workflow:

- **Bacon:** continuous compiler and Clippy feedback.
- **cargo-nextest:** faster tests, retries, profiles, slow-test handling, and improved CI output.
- **watchexec:** run an appropriate check–test–run pipeline after source changes.
- **cargo-generate:** scaffold projects from established templates.
- **cargo-seek:** terminal interface for finding and inspecting crates.
- **Criterion:** statistical benchmarks; add under `[dev-dependencies]`.

Do not run `cargo run` in a watcher for libraries or projects whose binaries require side effects or infrastructure. Prefer CI as the enforcement layer; local Git hooks are optional conveniences.

## Crate selection guide

Add these only when the project actually needs the capability:

- `color-eyre`: readable, contextual error reports in binaries and applications. Public libraries should generally expose structured error types instead.
- `itertools`: iterator operations that would otherwise require awkward custom code.
- `rayon`: straightforward CPU-bound data parallelism. Measure before introducing parallel overhead.
- `serde` with `derive`: serialization and deserialization.
- `clap` with `derive`: nontrivial command-line interfaces.
- Chrono or Jiff: date and time handling; reuse whichever the project already favors.
- `cmd_lib`: ergonomic external-command execution.
- `utoipa`: generated OpenAPI documentation for a Rust web API.
- `reqwest`, preferably with `rustls` where compatible: HTTP clients.
- `sqlx`: databases, migrations, and compile-time-checked queries.
- Leptos with Trunk: Rust web front ends.
- Dioxus: cross-platform application UI.
- Tauri: lightweight desktop applications backed by native webviews.

Before adding a crate, check maintenance status, MSRV compatibility, feature flags, compile-time cost, security implications, and whether an existing dependency already provides the capability.

## API design

Consider the typestate pattern when an API has a small set of meaningful states and some operations must be impossible in the wrong state. Encode the state in the type and consume `self` during valid transitions.

Do not introduce typestate for ordinary mutable data when it would only add generic complexity. Keep generic bounds and function signatures readable, using `where` clauses when they improve clarity.

## Completion requirements

After making changes:

1. Format the project.
2. Run compilation, Clippy, and the relevant tests.
3. Run `cargo-nextest` when configured; otherwise use `cargo test`.
4. Verify documentation tests where applicable.
5. Report every tool, dependency, lint, or configuration added.
6. List recommendations intentionally not applied and briefly explain why.
7. Identify any check that could not be run and what is needed to run it.
