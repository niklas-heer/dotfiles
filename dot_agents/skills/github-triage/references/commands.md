# Read-only GitHub commands

Examples use GitHub.com and the current authenticated account. Replace `OWNER`, `OWNER/REPO`, `NUMBER`, and `DEFAULT_BRANCH` with verified values. Apply explicit user scope to every search, including personal obligations and notifications.

## Discovery

```sh
rtk gh api user --jq .login
rtk gh search prs --review-requested=@me --state=open --limit=100 --json number,repository,title,url,updatedAt,isDraft,author,assignees,labels
rtk gh search prs --assignee=@me --state=open --limit=100 --json number,repository,title,url,updatedAt,isDraft
rtk gh search prs --author=@me --state=open --limit=100 --json number,repository,title,url,updatedAt,isDraft
rtk gh search prs --mentions=@me --state=open --limit=100 --json number,repository,title,url,updatedAt,isDraft
rtk gh search issues --assignee=@me --state=open --limit=100 --json number,repository,title,url,updatedAt,labels
rtk gh search issues --author=@me --state=open --limit=100 --json number,repository,title,url,updatedAt,labels
rtk gh search issues --mentions=@me --state=open --limit=100 --json number,repository,title,url,updatedAt,labels
rtk gh search prs --owner=OWNER --state=open --archived=false --sort=updated --limit=100 --json number,repository,title,url,updatedAt,isDraft,author,assignees,labels
rtk gh search issues --owner=OWNER --state=open --archived=false --sort=updated --limit=100 --json number,repository,title,url,updatedAt,author,assignees,labels
rtk gh api --method GET 'notifications?per_page=100' --paginate --jq '.[] | {reason,updated_at,repository:.repository.full_name,subject}'
```

For a selected repository, use `--repo=OWNER/REPO` instead of `--owner`. For general sweeps, owned-repository searches supplement rather than replace cross-repository obligations. Query each explicitly selected organization too. Include archived repositories when requested; otherwise disclose that the owned sweep excludes them.

Do not use `--include-prs` for issue searches when collecting PRs separately. Search JSON lacks PR check and review detail: use `gh pr view` below. Search is indexed and may lag; current item detail takes precedence.

The notifications command reads unread threads without marking them read. It can fail even when repository reads work. Subject URLs are API URLs, not user-facing links; resolve current item detail and use its HTML URL. Filter notifications to the user's requested scope. Paginated `gh api` output consists of separate page results; the supplied `--jq` streams one object per thread, not one combined JSON array.

## Candidate detail

```sh
rtk gh pr view NUMBER --repo OWNER/REPO --json number,url,title,state,body,author,isDraft,updatedAt,assignees,labels,reviewRequests,reviewDecision,latestReviews,comments,mergeable,mergeStateStatus,statusCheckRollup,headRefOid
rtk gh issue view NUMBER --repo OWNER/REPO --json number,url,title,state,body,author,updatedAt,assignees,labels,comments,milestone
rtk gh pr checks NUMBER --repo OWNER/REPO
rtk gh repo view OWNER/REPO --json defaultBranchRef
rtk gh run list --repo OWNER/REPO --branch DEFAULT_BRANCH --limit=10 --json databaseId,workflowName,status,conclusion,createdAt,headSha,url
```

Inspect specific review threads or logs only when summaries leave a decision unresolved. `gh pr checks` can exit nonzero for failed or pending checks; inspect its output rather than treating every nonzero exit as an authentication error. Do not claim that truncated discussion establishes the latest response; paginate the relevant API endpoint if needed. Avoid dumping entire logs or private discussions into the report or oracle.

Command shapes checked against local CLI help and the official [PR search](https://cli.github.com/manual/gh_search_prs), [issue search](https://cli.github.com/manual/gh_search_issues), [PR detail](https://cli.github.com/manual/gh_pr_view), and [notifications](https://docs.github.com/en/rest/activity/notifications) documentation on 2026-09-19. Recheck when the CLI/API changes.
