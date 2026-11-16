---
name: davinci-resolve
description: Use when driving DaVinci Resolve Studio through its MCP server or Python scripting API, such as importing media, building or changing timelines, placing clips, titles, graphics or markers, grading, rendering, or checking an edit, and when a Resolve call returns True or a list but nothing changed.
---

# DaVinci Resolve

Resolve's scripting API says yes too easily: setters return True and change nothing, appends return
items that don't exist, and renders report success for jobs that never ran. Work in small steps, read
everything back, and judge pictures by rendered frames.

## Connection

Blackmagic's official ResolveMCP ships with Resolve Studio. Find its tools through the host's tool
discovery; the namespace varies (Claude Code: ToolSearch `DaVinci Resolve`). Tool names below are
unqualified.

- `run_script` runs Python with `resolve` and `project` injected; set `result`. It has no `os` or
  file access. The default timeout is 10 s; pass `timeout` up to 60. `project` is bound when the call
  starts and dies if the script creates or loads a project: then use
  `resolve.GetProjectManager().GetCurrentProject()`.
- `run_script_unsafe` adds OS access. Use it only when the script itself needs files or processes.
- Look calls up with `search_scripting_api` or `get_scripting_api` instead of recalling them, and
  call `get_whats_new` with the last version you know. Use the dict forms `GetSettings`/`SetSettings`,
  `GetProperties`/`SetProperties` and `GetClipProperty()`; the single-key forms are deprecated.
- `get_image`, `get_thumbnails` and `describe_grade` are the evidence for picture and grade claims.
- AI model packs (`list_extras_packages`) are 1 to 5.6 GB each. Ask before installing one.
- `generate_lut` and `write_dctl` write into the `MCP/` LUT folder; apply with
  `graph.SetLUT(node, "MCP/name.cube")`.

Facts below were verified on Studio 21.2.0.6. The API changes between patch releases, so check
`resolve.GetVersionString()`, and confirm a call exists with `"Name" in dir(obj)`: `hasattr`
returns True for every name on a Resolve object.

## Boundaries

- Within the task, prefer additive changes: new timelines with versioned names (`assembly v2`), new
  tracks and bins. Before a destructive or hard-to-reverse edit, duplicate the timeline or export a
  `.drp` (`ProjectManager.ExportProject`). There is no undo API.
- Before switching projects, note the project's name and current timeline. If it is
  `Untitled Project`, or `SaveProject()` does not return True, stop and ask the user to save it
  (`CloseProject` discards unsaved changes). Afterwards `LoadProject` it and restore the timeline.
  Experiments go in a disposable `_mcp-<topic>` project that you delete when done.
- Camera originals are read-only. Never overwrite a file Resolve has imported; write a new version.
- Follow the project's own instructions (for example an `AGENTS.md` that says where the project
  library, caches and renders live).
- When something is not scriptable (creating a project library, track-level audio effects), tell the
  user what to do; don't invent menu paths.

## Verify every step

1. Make the timeline current before working on it: `project.SetCurrentTimeline(tl)`, then check
   `project.GetCurrentTimeline().GetName()`, in every script. `AppendToTimeline` and
   `tl.InsertFusionTitleIntoTimeline` act on the current timeline whatever object you call them
   through (the other `Insert*` calls are untested; make the timeline current first);
   `tl.GrabStill()` on another timeline switches the current one; `DuplicateTimeline` makes the copy
   current. Do the same before `AddRenderJob`.
2. After each write, read the state back: item lists per track, positions, durations, settings.
   Compare the number of returned items with the number requested; an item whose `GetDuration()` is
   None was never placed.
3. Pictures: `get_image`/`get_thumbnails` before and after any grade, look, title or graphic. Use
   source `timeline` for anything on upper tracks; `timeline_item` shows one clip only.
4. Renders: see the render recipe. `StartRendering` returning True does not mean every job ran;
   the output file is the proof.
5. `resolve.GetProjectManager().SaveProject()` after each completed step, only on a named project
   (Project has no `SaveProject`).

## Time and frames

| Value | Frame space |
| --- | --- |
| Timeline positions, `recordFrame`, `GetStart()`, `MoveItems` `startFrame` | Absolute: `tl.GetStartFrame()` + offset (01:00:00:00 is 90000 at 25 fps) |
| `tl.AddMarker(frameId, color, name, note, duration)` | Offset from timeline start. An absolute frame returns True and lands far past the end. All five arguments are required |
| `get_image`/`get_thumbnails` `frame_offset` | Offset from timeline start; their `timecode` is absolute |
| Render `MarkIn`/`MarkOut` | Absolute, `MarkOut` inclusive. Relative values return True and render one frame |
| `AppendToTimeline` `startFrame`/`endFrame` | Source frames in the clip's own frame rate, `endFrame` exclusive |

Mixed frame rates conform by time: frames 0 to 30 of a 30 fps clip fill 25 frames of a 25 fps
timeline. Set the project's `timelineFrameRate` and resolution before the first timeline; the frame
rate is fixed afterwards (`SetSettings` returns False). New projects default to 3840x2160 at 24 fps.
Settings mix types (`timelineFrameRate` is a float, resolution a string). A new timeline already
has V1 and A1.

## Common traps

| Symptom | Cause |
| --- | --- |
| Clip or title landed in the wrong timeline | Appends and inserts go to the current timeline (see step 1) |
| Append returns `[item]`, track unchanged | The track doesn't exist (`AddTrack` first) or the range overlaps a clip; appends never overwrite |
| Resolve aborts a second after an import (`std::out_of_range`) | `MediaPool.ImportMedia` after a timeline was built in the session. Import with `MediaStorage.AddItemListToMediaPool([path])`, one file per call |
| `launch_resolve` says running, next call says not running | No process yet (after a quit or crash). `pgrep -f 'MacOS/Resolve$'`, else `open -a "DaVinci Resolve"` and wait |
| Title pushed every clip on V1 later | `Insert*IntoTimeline` is an insert edit on V1 at the playhead. Use the title recipe |
| Re-rendered graphic shows old frames | Resolve caches decoded frames. New file name plus `ReplaceClip` |
| Render job stays "Ready" | An earlier preset (e.g. "Audio Only") still governs it. Load the intended preset first |
| UI jumped to Deliver | Render setters switch pages. Return with `OpenPage` |
| `AddTransition` returns None | The clip has no handles at that edge |
| Track list indices shifted | Transitions are items in `GetItemListInTrack` |

Before placing titles or graphics, copying grades, setting audio levels or rendering, read
[references/recipes.md](references/recipes.md): tested recipes and the full trap list.
