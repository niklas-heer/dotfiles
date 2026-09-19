---
name: find-project-name
description: Generate and compare names for projects, apps, libraries, or tools, screen collisions with live sources, and present an evidence-backed shortlist. Uses the hub's Rust namecheck tool with Codex CLI generation/judging and optional Jev ranking.
---

# Find a project name

Resolve the existing hub with `rtk ghq list --full-path hub` (GHQ-relative path `github.com/niklas-heer/hub`). Read `docs/namecheck.md` there for exact CLI interfaces, coverage, setup, and exit semantics. Run project commands with the hub as working directory. If the hub is unavailable, use live search and clearly disclose which automated checks were not run.

Establish the product's purpose, audience, naming style, relevant ecosystems, desired domain suffixes, and known rejected names from the conversation. Ask only for missing constraints that materially affect selection. Distinguish inventing a name from checking a user-selected one.

## Generate and screen

For fresh candidates, use `rtk mise run names -- find --brief 'Product and preferences' --count 6 --exclude rejected,names --json`. It generates one batch using Codex CLI's saved ChatGPT sign-in and immediately screens it. Use an appropriate profile (`macos`, `rust`, `node`, `python`, `all`), `--sources` override, and `--tlds` when needed. Save reports in the hub's ignored `scratch/` when another step consumes them. Existing candidates only need `check NAME... --json`.

No OpenRouter key is needed. Codex subscription limits still apply. Do not silently switch to API billing or another paid provider on failure. A missing CLI/login or a usage limit does not invalidate collision checks; explain the gap and use ordinary brainstorming when appropriate. The tool never buys domains or creates repositories.

Start with a small, diverse batch. Refine toward the user's taste and carry rejected names into later exclusions. Avoid an open-ended loop: ordinarily use at most three generation batches, then present the strongest options or the remaining tradeoff. An explicit user-requested search budget takes precedence.

Interpret evidence correctly:

- `matches` means records exist, not that every result is a relevant competitor. Review names, descriptions, URLs, and the product category.
- `no_match` applies only to the source/query. It is not global uniqueness, domain purchasability, or trademark clearance.
- `unknown` and `complete: false` remain unresolved. Rate limits, malformed replies, truncation, missing tools, or unsupported RDAP services never count as available.
- A same-category product is a stronger branding collision than an unrelated repository or an occupied domain. Zero-star projects still count as evidence.

For the shortlist, search the exact names plus the category/platform, inspect primary product/repository pages, and check likely spelling variants. This web step is essential: package registries and one App Store storefront cannot cover all software. Use registrar results for actual purchase availability; do not infer it from missing DNS or an RDAP 404. Report trademark screening as unperformed unless it was actually done.

## Judge and recommend

Use `namecheck rank --brief 'Product and preferences' < report.json` for Codex judgments with reasons. Use `--judge jev` when a quick typed fit/category-relevance judgment would help and `capture-gate status` confirms an existing session. Jev selects among supplied options; it does not generate names or discover facts. Never start credential access merely to obtain an optional ranking. Both providers receive the brief and selected evidence externally; exclude secrets and incidental private context.

Rank a small shortlist (up to eight). Unknown coverage, evidence omitted from the ranking request, low confidence, and a `none` recommendation require reasoning or further research; do not rerun solely to get a preferred answer. Model scores are advisory, not calibrated name quality or verified availability. Category-collision findings from web research outrank an unsupported AI reassurance.

Present a few names with rationale, relevant collisions, checked domain status, links, observation date, and material gaps. Recommend a favorite without choosing on the user's behalf. Preserve accepted decisions and useful research at a natural checkpoint; avoid storing every transient API response as durable knowledge. Naming authorization does not itself authorize domain purchase, repository publication, or contacting existing owners.
