# Recovery and inspection

## A lost response is uncertain, not failed

A client disconnect does not stop an accepted operation. It keeps running under its deadlines and its output is discarded once the connection fails.

`latchrun session reconnect <name>` inspects status and outcomes. It never replays a command and never returns retained output. After a lost response, inspect the status, reconcile any remote effect the command may have had, and only then choose a **new** operation ID. Do not retry with the previous ID; that fails with `duplicate_operation`, which is the protection working.

## After a service restart

Previously active sessions become `interrupted` and their unfinished operations become `unknown`. Completed outcomes and every reserved operation ID survive. Reactivating an interrupted session requires an explicit profile:

```sh
latchrun session resume <name> --profile <path>
```

No work is replayed. The runtime directory defaults to `/tmp/latchrun-<uid>`, which the OS can clear; losing it loses operation-ID protection, so set `--runtime-dir` or `LATCHRUN_RUNTIME_DIR` to a durable path when that protection matters across reboots.

## Inspection

- `latchrun session status [name]` — session state and operation outcomes.
- `latchrun inspect <name>` — session detail, including exposed non-secret environment.
- `latchrun events [name]` — event stream.
- `latchrun stats [--days 1|7|30|90]` — durable usage analytics.
- `latchrun dashboard serve` — local dashboard at a printed private URL; runs in the foreground until interrupted.

## What is retained

The owner-only journal stores bounded session and operation metadata plus used-ID tombstones. It never stores profiles, provider references, credentials, cached values, environment values, argv or command output. No command output is retained anywhere, so nothing can be recovered after the fact — capture what is needed at run time.

Unsafe, corrupt or inconsistent journals fail closed rather than degrading.

## Common errors

| Error | Meaning | Response |
| --- | --- | --- |
| `policy_denied` | Executable or arguments not in the allowlist | Stop, add the complete command, resume |
| `session_active` | Tried to replace the profile of a running session | Stop the session first |
| `duplicate_operation` | Operation ID already used | Inspect its outcome; use a new ID only after reconciling |
