---
name: goodnight
description: Use when Niklas says goodnight or is going to bed and wants the Mac to sleep once his T3 Code agent threads have finished, including checking, changing, or cancelling that.
---

# Goodnight

Arm the hub's `t3-sleep` watcher, then end your turn. Invoke with `/goodnight` in a Claude thread or `$goodnight` in a Codex thread. Details of what counts as busy are in the hub's `docs/t3-sleep.md`.

Arguments are optional and in plain words: a limit (`3h`, `until 1am`), `status`, or `cancel`.

## Procedure

1. Resolve the hub with `rtk repot list --full-path hub` (tree path `github.com/niklas-heer/hub`).
2. Check for a running watcher with `pgrep -x t3-sleep`.
   - `cancel`: run `pkill -x t3-sleep`, confirm it is gone, and stop.
   - `status`: report whether one runs and the last lines of `~/Library/Logs/t3-sleep.log`, and stop.
   - One already runs and no new limit was given: report it and stop. With a new limit, `pkill -x t3-sleep` first.
3. Build in the hub, so the binary matches the checkout. If this fails, report it and leave nothing armed.

   ```sh
   rtk mise exec -- cargo build --quiet --locked --release --bin t3-sleep
   ```

4. Work out `--max-wait-secs`: 28800 (8 hours) by default, otherwise the requested limit in seconds from now.
5. Start it detached, as its own shell command from the hub:

   ```sh
   nohup target/release/t3-sleep --max-wait-secs 28800 </dev/null >>"$HOME/Library/Logs/t3-sleep.log" 2>&1 &
   ```

   Use this exact form, without `rtk` or a harness background option. The watcher must outlive this command's shell. A foreground or harness-tracked command keeps this thread busy, so the watcher would wait for itself until the limit.

6. Run `sleep 2`, then `pgrep -x t3-sleep` and `tail -n 4 "$HOME/Library/Logs/t3-sleep.log"`. If it exited, report the log's error. Exit code 2 about a newer state store means T3 Code moved its data and `t3-sleep` needs updating. Nothing is armed in that case, so say so plainly.
7. Reply in two or three sentences: which threads it is waiting on (from the log), that the Mac sleeps after 5 quiet minutes or at the limit, that the lid must stay open, and that `/goodnight cancel` undoes it. Then end your turn, because this thread counts as busy until you do.
