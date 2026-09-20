---
name: t3-handoff
description: Hand agreed work from the current conversation to a new T3 Code thread for another project, so Niklas can pick that thread's provider and model. Use when Niklas asks to open, start, or hand off a task to another repository in T3 Code, or says "new thread for X".
---

# Handing work to a new T3 Code thread

Niklas has settled what needs to happen in another project and wants it done in
a thread of its own, where he chooses the model. Your job is to resolve that
project's checkout, write a brief the new thread can act on, put the brief on
the clipboard, and open the thread. He pastes the brief as its first message.

Invoke with `$t3-handoff` in Codex/T3 Code or `/t3-handoff` in Claude Code.
Its action display name is **Hand off to T3 thread**.

The activation protocol behind `t3 app` carries only a directory (verified on
t3 v0.0.42, 2026-09-20), so nothing can seed the first message. The clipboard
is the handoff channel, and the paste is Niklas's review of the brief.

## 1. Resolve the target checkout

Find it with `rtk ghq list --full-path <query>` and require exactly one match.
When the repository exists on GitHub but not locally, clone it with `ghq get`
as the git reference of `niklas-preferences` describes. Ask when several
checkouts match; opening the wrong project wastes the whole handoff.

## 2. Identify this thread

The new thread can rebuild this conversation with `t3-thread` if it knows this
thread's ID. Read it from the state store, never write there:

```bash
sqlite3 -readonly "file:$HOME/.t3/userdata/state.sqlite?mode=ro" "
SELECT t.thread_id FROM projection_threads t
JOIN projection_projects p ON p.project_id = t.project_id
JOIN projection_thread_sessions s ON s.thread_id = t.thread_id
WHERE p.workspace_root = '$PWD' AND t.deleted_at IS NULL AND s.status = 'running'
ORDER BY t.updated_at DESC LIMIT 1;"
```

Exactly one row is this thread. Zero or several rows: leave the ID out of the
brief rather than guess.

## 3. Write the brief

The brief has these parts, in this order:

1. This thread's ID on the first line by itself, when step 2 found one.
2. **Goal** — one or two sentences stating what done looks like.
3. **Decided** — each decision already made here, one bullet each, so the new
   thread does not reopen them.
4. **Constraints** — boundaries, tools or files to use or avoid, and every
   correction Niklas gave in this conversation.
5. **First step** — the one concrete action to start with.
6. **Open** — unresolved questions; omit the heading when there are none.

Write facts from this conversation in Niklas's terms, under about 250 words.
The new thread already has its project's instructions and skills, so do not
restate workflow. Keep credentials and private paths out. Save the brief to a
temporary file, then copy it:

```bash
pbcopy < "$BRIEF_FILE"
```

## 4. Open the thread

```bash
rtk t3 app '<absolute checkout path>'
```

This adds the project when missing and opens a new thread in the running
desktop app on this machine. Success prints `Opened <path> in T3 Code.` On any
other result, report the exact error and the command so Niklas can retry; the
brief stays on the clipboard either way.

## 5. Report, then stop

Tell Niklas which project opened, that the brief is on the clipboard, and that
he should pick the model and paste it as the first message. Show the brief in
your reply as well, so he can review it without pasting. Then stop: do not
start the work here, and do not open further threads for follow-ups — later
work on the same task reuses the thread just opened.

## Boundaries

- Only an explicit handoff request opens a thread. Discussing, cloning, or
  editing another repository does not.
- One thread per handoff.
- Do not commit the brief into either repository.
