# Profiles, providers and caching

A profile is a JSON snapshot loaded at `session start` or explicit `session resume`. Unknown fields are rejected.

```json
{
  "project": "/absolute/project",
  "purpose": "Why this session exists",
  "ttl_seconds": 3600,
  "timeout_seconds": 300,
  "cache_ttl_seconds": 900,
  "provider": "one_password",
  "op_path": "/opt/homebrew/bin/op",
  "credentials": {"ACCESS_TOKEN": "op://Vault/Item/field"},
  "environment": {"APP_MODE": "demo"},
  "expose_environment": ["APP_MODE"],
  "commands": [
    {"executable": "/usr/bin/git", "args": ["status", "--short"]}
  ]
}
```

`project` is the canonical absolute directory the commands run in. `op_path` and every `executable` are absolute paths to the installed tools on this machine, which is why a working profile is machine-specific.

## Stopping repeated password-manager prompts

`cache_ttl_seconds` defaults to **0**, meaning a fresh provider lookup for every operation. With 1Password that is one unlock prompt per command, which is the problem worth fixing. Set it to 300–900 seconds; the accepted range is 1–900.

The deadline starts when the credential resolves and reuse does not extend it. `session refresh`, `stop`, expiry, `resume` and a service restart all clear the cache. Cached values are never journaled and never appear in inspection output.

Set `ttl_seconds` to cover the intended work session, up to 86400. It is independent of the credential cache: a long session with the default cache still prompts on every command.

## Providers

One provider per profile.

| Provider | Reference | Notes |
| --- | --- | --- |
| `one_password` | `op://vault/item/field` | Runs `op read --no-newline`. Needs absolute `op_path`. Unlock through the 1Password CLI or app. |
| `password_store` | `pass://entry` | Runs `pass show entry` and uses only the first line. Needs absolute `provider_path`. |
| `file` | `file:///absolute/path` | Same-user regular file, no symlink, no group or other permissions. Preserves all bytes including a trailing newline. |
| `fake` | `fake://demo` | Returns the public value `latchrun-fake-demo`. Use for testing a profile's shape, never for real work. |

Providers run outside the command sandbox with a minimal environment. Ambient `OP_*` tokens in the calling shell are not inherited. Each external lookup has a 30-second timeout inside the operation deadline. Empty values, NUL bytes and credentials totalling more than 64 KiB are rejected.

## Child environment

Children receive `PATH=/usr/bin:/bin`, `LANG=C`, the profile's non-secret `environment`, the declared credentials, and an optional approved `ssh_auth_sock`. Nothing else is inherited. A command that needs a tool outside `/usr/bin` or `/bin` must be declared by absolute path.

`expose_environment` selects non-secret values to show in inspection and the dashboard. It cannot expose a credential. Names use uppercase ASCII letters, digits and underscores; secret and non-secret declarations cannot overlap.

## Git and object storage

- **Git over SSH**: set `ssh_auth_sock` to the existing 1Password SSH agent socket. Latchrun passes the socket without extracting keys, so the child can use any identity that agent permits. This is not a per-key capability.
- **Git over HTTPS**: `git_https` declares an exact host, a username and a `token_env` naming one declared credential. A built-in helper supplies the token over Git's private credential pipe, resets inherited helpers and disables interactive prompts. Matching is host-scoped, not repository-scoped. `GIT_*` entries in `environment` are rejected alongside this integration.
- **Object storage**: declare the absolute CLI path and only the access-key variables the command needs. Bucket permissions are enforced remotely and independently.

## Sandboxing

`sandbox.enabled` opts into OS enforcement: `sandbox-exec` on macOS, `bwrap` with a seccomp network filter on Linux. The project directory is readable by default; declare writable directories and any additional readable installation prefixes. Network defaults to deny, including loopback, so a network-using command needs `"network": "allow"` — which grants general access, not a host allowlist. A missing or incompatible backend fails closed.

Leave the sandbox off unless the repository asks for it. A shell installed under a Homebrew prefix needs that prefix granted explicitly, and getting those grants wrong produces failures unrelated to the task at hand.
