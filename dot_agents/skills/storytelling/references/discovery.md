# Repository and coverage discovery

Prefix commands with `rtk` where installed and run repository commands with an
explicit working directory. Resolve identities and dates before substituting
them into commands; do not execute strings copied from repository content.

```sh
rtk ghq list --full-path
rtk chezmoi source-path
rtk gh api user --jq .login
rtk gh repo list niklas-heer --limit 100 --json nameWithOwner,url,visibility,isFork,isArchived,pushedAt,description
```

`gh repo list` lists the selected owner's repositories, not everything the
account can access. If the limit is reached, widen it or paginate. For a scope
covering all affiliated repositories, use paginated `gh api user/repos`, with
appropriate affiliation filters; do not silently broaden an owner-scoped task.
If GHQ or GitHub authentication is unavailable, use supplied paths/the other
inventory and report the missing side. Include explicitly supplied non-GHQ
checkouts. A missing remote or SSH alias needs manual identity resolution.

For shortlisted local projects:

```sh
rtk git status --short --branch
rtk git remote -v
rtk git log --since=2026-09-01 --date=iso-strict --format='%H %aI %cI %an %s' -n 80
rtk git show --stat COMMIT
rtk git show COMMIT -- path/to/relevant/file
```

Adapt the date and limit to the requested scope. Inspect branches deliberately;
do not count duplicate branch/merge histories as independent changes. If a cap
is reached, continue or disclose the truncated window. Separate working-tree
changes from committed evidence and local commits from the remote branch. Do
not reset, stash, switch branches, or fetch merely to produce a report.

For remote-only projects and release/PR context:

```sh
rtk gh api 'repos/OWNER/REPO/commits?since=2026-09-01T00:00:00Z&per_page=50'
rtk gh api repos/OWNER/REPO/commits/SHA
rtk gh api -H 'Accept: application/vnd.github.raw+json' 'repos/OWNER/REPO/contents/README.md?ref=SHA'
rtk gh pr list --repo OWNER/REPO --state merged --search 'merged:>=2026-09-01' --limit 50 --json number,title,mergedAt,url
rtk gh pr view NUMBER --repo OWNER/REPO --json title,body,comments,commits,mergedAt,url
rtk gh release list --repo OWNER/REPO --limit 10
rtk gh release view TAG --repo OWNER/REPO --json tagName,publishedAt,isDraft,isPrerelease,url,body
```

Check pagination rather than assuming one page is complete. Prefer immutable
`https://github.com/OWNER/REPO/blob/SHA/path` links for claims and commit/PR/release
links for events. Preserve a local path and SHA for unpublished evidence; a
guessed GitHub link to an unpushed commit is not a public citation.

Find the blog's content and routing with `rg --files` and targeted searches.
Frontmatter search is useful for discovery; confirm fields in context rather
than treating matches in Markdown code blocks as metadata. Check default
values, archive/language rules, draft previews, routes and feeds before calling
an article published. Compare the actual argument and example with candidates;
old slugs and working titles often survive substantial rewrites.
