# nheer.io local preview

Observed on 2026-09-19; the repository's current README, mise tasks, routes and
deployment configuration take precedence.

- Content: `src/content/posts/YYYY/*.md` or `.mdx`.
- Frontmatter: `title`, `date`, optional `description`, `tags`, `icon`; use
  `draft: true` and the requested `lang` (`en`/`de`).
- Local draft route: `/drafts/<content-id>/`, where the ID includes the year and
  filename stem. Confirm the link from `/drafts/` instead of guessing the slug.
- Normal publishing filters exclude drafts. `PREVIEW_DRAFTS=true` enables the
  local draft routes, not normal homepage/post/RSS listings.

From the blog checkout:

```sh
rtk mise run preview:articles --port 4323
```

The existing task supplies `PREVIEW_DRAFTS=true`, `SITE_TEST_DATA=true` and
`--host 127.0.0.1`; it needs no live integration credentials. Reuse an existing
healthy server for this checkout when possible; if the port belongs to another
process, select a free port rather than killing it. Keep the server alive after
opening the article so Niklas can review and request edits.

The current full check is `rtk mise run check`: sample-data production build,
pipeline/unit/browser checks, and dependency audit. If its dedicated port 4321
is occupied, use `PLAYWRIGHT_PORT=44321` for that test run. Do not reuse a live
user preview as the test runner's managed server. Test new article interactions
against the separate draft preview and inspect actual screenshots.

For production-exclusion verification, use a normal sample-data build without
`PREVIEW_DRAFTS`; confirm there is no article route and no draft entry in the
homepage, post index or RSS. Local draft preview builds are not deployable.
Never invoke refresh/publish tasks merely to preview an article: those sync
live data and can deploy. Inspect current automatic deployment behavior before
pushing changes; draft content must remain excluded from its production output.
