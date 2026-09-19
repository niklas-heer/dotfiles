---
name: dagger-ci
description: Set up or maintain reproducible CI with Dagger and the Dang SDK, including local commands and thin CI-provider workflows. Use for Dagger pipelines or adopting Niklas's preferred CI stack.
---

# Dagger CI with Dang

Niklas prefers Dagger with the Dang SDK for CI. Keep project tools and task shortcuts in mise; put container orchestration in Dang and substantive application/tool logic in the project's language. Apply this preference to requested CI work, without migrating unrelated repositories or adding deployment stages.

## Establish the version and checks

Inspect the repository's instructions, tool manifests, existing workflow, and native checks. Preserve required coverage, including native macOS/Windows checks: a Linux container on a Mac still tests Linux. Machine inventory checks that depend on private checkouts belong on the developer machine; fixture tests can run in CI.

Check the installed CLI's help and the chosen release's official sources before scaffolding. Pin Dagger in project-local mise and keep the module's engine requirement and CI CLI version aligned. Do not mix a stable CLI with examples from newer beta documentation.

Verified with Dagger **0.21.9** on 2026-09-19:

- `dagger init --sdk=dang --name=<module> --source=.dagger` configures the built-in Dang SDK in `dagger.json`. Add the module implementation under `.dagger/` (for example `main.dang`); inspect generated files rather than assuming a starter was produced. In repositories without a license, init may offer to generate one; preserve the project's licensing intent.
- `dagger functions` loads the module; `dagger call <function>` executes it.
- Dang public functions use `pub`; `Directory! @defaultPath("/")` accepts the project context. Use `@ignorePatterns` to limit inputs.
- Dagger evaluates lazily. Return an evaluated value such as `.stdout`, or call `.sync` and end a `Void` function with `null`, so failed commands fail CI.
- Modules with `engineVersion >= v0.21.5` use Dang v2. Consult that release's syntax when upgrading older modules.

The default documentation currently describes the 1.0 beta (`dagger.toml`, `dagger-module.toml`, `dagger module init`, `dagger api call`). Recheck these version-specific facts when adopting another release.

## Build and verify

On macOS, use Apple's native `container` tooling or Colima, per Niklas's preference. For Colima, start its Docker runtime and verify the selected Docker context and `docker info`. Do not start a different installed runtime merely because it is the current Docker context. Dagger's [0.21 Apple Container guide](https://docs.dagger.io/0.21/reference/container-runtimes/apple-container/) labels support experimental; test the chosen engine with the pinned Dagger release.

Reuse existing native check/build tasks inside a pinned container. Keep provider YAML limited to checkout, installing the pinned Dagger CLI, and calling the pipeline. Add a mise shortcut for the same local invocation. Declare the container-engine prerequisite and verify connectivity before blaming module code.

Include required manifests, lockfiles, source, tests, and compile-time inputs; exclude Git metadata, local build output, disposable artifacts, and credentials. Install dependencies before copying frequently changing source where practical. Scope persistent caches to the project/toolchain and synchronize writable caches when needed. Keep credentials as explicit Dagger secrets; ordinary CI should not require a Cloud token unless the project uses Cloud.

Run module discovery and the actual pipeline, then exercise one failing check in an isolated source copy to confirm a nonzero result. Verify the generated workflow with the provider or an available validator. Report any unexecuted platform/runtime checks accurately. CI setup does not authorize a release, production deployment, or secrets upload.

## Sources

- [Dagger documentation](https://docs.dagger.io/) — select documentation matching the pinned release.
- [Stable Dang version support](https://github.com/dagger/dagger/blob/v0.21.9/core/sdk/dang/README.md)
- [Stable input directive examples](https://github.com/dagger/dagger/blob/v0.21.9/core/integration/testdata/modules/dang/test-directives/main.dang)
- [Dagger GitHub action](https://github.com/dagger/dagger-for-github) — inspect the selected revision's inputs and pin its commit.
