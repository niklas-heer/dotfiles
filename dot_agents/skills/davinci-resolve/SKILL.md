---
name: davinci-resolve
description: Use when driving DaVinci Resolve Studio through its MCP server or Python scripting API, such as importing media, building or changing timelines, placing clips, titles, graphics or markers, grading, rendering, or checking an edit, and when a Resolve call returns True or a list but nothing changed.
---

# DaVinci Resolve

Resolve's scripting API says yes too easily: setters return True and change nothing, appends return
items that don't exist, and renders report success for jobs that never ran. Work in small steps, read
everything back, and judge pictures by rendered frames.

## Connection

Blackmagic's official `ResolveMCP` ships inside the app (Studio only; the free edition has no
scripting). Its tools are `mcp__DaVinci_Resolve__*`; load them with ToolSearch `DaVinci Resolve`.

| Tool | Use |
| --- | --- |
| `get_resolve_status`, `launch_resolve` | Check that Resolve runs, or start it |
| `run_script` | Python with `resolve` and `project` injected; set `result`. No `os`/files; max 60 s per call |
| `run_script_unsafe` | Same with OS access. Only when the script itself needs files or processes |
| `search_scripting_api`, `get_scripting_api` | The API for the installed build. Look calls up instead of recalling them |
| `get_scripting_docs` | Settings keys, enum values, Fusion and DCTL reference |
| `get_whats_new` | Changelog; call it with the last version you know before relying on memory |
| `get_image`, `get_thumbnails` | Rendered frames of timeline, clip or pool item: the evidence for picture claims |
| `describe_grade` | What a node graph actually contains |
| `generate_lut`, `write_dctl`, `list_luts` | Looks; apply with `Graph.SetLUT(node, "MCP/name.cube")` |
| `list_extras_packages`, `install_extras_package` | AI model packs (1 to 5.6 GB each). Ask before installing |

Facts below were verified on Studio 21.2.0.6. The API changes between patch releases, so check
`resolve.GetVersionString()`, and confirm a call exists with `"Name" in dir(obj)`: `hasattr`
returns True for every name on a Resolve object.

## Boundaries

- The open project is the user's. Add rather than change: new timelines with versioned names
  (`assembly v2`), new tracks and bins. Change or delete their timelines, media or settings only
  when asked, and duplicate the timeline (`DuplicateTimeline`) or export a `.drp`
  (`ProjectManager.ExportProject`) first.
- `CreateProject`/`LoadProject` switch the user's open project. Experiments go in a disposable
  project (`_mcp-<topic>`) only when the task allows switching; delete it after (`CloseProject`, then
  `DeleteProject`) and say what was open before.
- Camera originals are read-only. Never overwrite a file Resolve has imported; write a new version.
- Follow the project's own instructions (for example an `AGENTS.md` that says where the project
  library, caches and renders live).
- When something is not scriptable (creating a project library, the gallery panel, track-level
  audio effects), tell the user what to do; don't invent menu paths.

## Verify every step

1. After each write, read the state back: item lists per track, positions, durations, settings.
2. A returned `TimelineItem` can be dead. If `item.GetDuration()` is None, nothing was placed.
3. Pictures: `get_image`/`get_thumbnails` before and after any grade, look, title or graphic.
4. Renders: poll `GetRenderJobStatus(job)` for each job, then `ffprobe` the file (streams, frame
   count, size). `StartRendering` returning True does not mean every job rendered.
5. `resolve.GetProjectManager().SaveProject()` after each completed step (Project has no
   `SaveProject`), and re-read counts after saving.

## Time and frames

| Value | Frame space |
| --- | --- |
| Timeline positions, `recordFrame`, `GetStart()`, `MoveItems` `startFrame` | Absolute: `tl.GetStartFrame()` + offset (01:00:00:00 is 90000 at 25 fps) |
| `AddMarker(frameId, ...)` on a timeline | Offset from timeline start. An absolute frame returns True and lands far past the end |
| Render `MarkIn`/`MarkOut` | Absolute, `MarkOut` inclusive. Relative values return True and render one frame |
| `AppendToTimeline` `startFrame`/`endFrame` | Source frames in the clip's own frame rate, `endFrame` exclusive |

Mixed frame rates conform by time: frames 0 to 30 of a 30 fps clip fill 25 frames of a 25 fps
timeline. Set the project's `timelineFrameRate` and resolution before the first timeline; the frame
rate is fixed afterwards (`SetSetting` returns False). New projects default to 3840x2160 at 24 fps.
`GetSetting` mixes types (`timelineFrameRate` is a float, resolution a string), so convert before
comparing. A new empty timeline already has V1 and A1.

## Common traps

| Symptom | Cause and fix |
| --- | --- |
| Append returns `[item]`, track unchanged | The target track doesn't exist (`AddTrack` first) or the range overlaps a clip; appends never overwrite |
| Title or generator pushed every clip later | `Insert*IntoTimeline` is an insert edit on V1 at the playhead, and locking V1 makes it fail. Park the playhead at the timeline end, insert, then `tl.MoveItems([title], {"trackIndex": 2, "startFrame": abs_frame})` |
| Re-rendered graphic still shows the old frames | Resolve keeps decoded and cached frames. Write a new file name and `MediaPoolItem.ReplaceClip(new_path)`; the clip keeps its timeline place |
| Render job stays "Ready" | A loaded preset (e.g. "Audio Only") still governs it. `LoadRenderPreset` the intended preset, then override |
| UI jumped to Deliver | Render setters switch pages. Note `GetCurrentPage()` first, `OpenPage` back after |
| `Timeline.ApplyGradeFromDRX` missing | Use `item.GetNodeGraph().ApplyGradeFromDRX(path, 0)`; it replaces the grade |
| Track list indices shifted | Transitions are items in `GetItemListInTrack` |
| `project.GetName()` returns None | The injected `project` dies when a call creates or loads a project. Use the returned object or `resolve.GetProjectManager().GetCurrentProject()` |
| `ImportMedia` returns `[]` | Pass plain path strings; the `{"FilePath": ...}` dict form returned nothing |
| Need to undo an edit | There is no undo API. Duplicate the timeline before risky edits and rebuild from the copy |

Recipes and the full trap list with build stamps: [references/recipes.md](references/recipes.md).
Read it before placing titles, replacing graphics, copying grades or rendering.
