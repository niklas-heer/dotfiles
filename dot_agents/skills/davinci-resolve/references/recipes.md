# Resolve recipes and traps

Each recipe ran on DaVinci Resolve Studio 21.2.0.6 through the official MCP `run_script`. Recheck a
recipe when `resolve.GetVersionString()` reports a different build.

## Recipes

### Place clips and confirm them

```python
mp = project.GetMediaPool()
project.SetCurrentTimeline(tl)                      # appends go to the current timeline
start = tl.GetStartFrame()
fps = float(clip.GetClipProperty()["FPS"])          # source frames are in the clip's own rate
infos = [{
    "mediaPoolItem": clip,
    "startFrame": int(2 * fps), "endFrame": int(4 * fps),   # end exclusive
    "mediaType": 1, "trackIndex": 1,                         # omit mediaType for video + audio
    "recordFrame": start + 0,                                # absolute timeline frame
}]
placed = mp.AppendToTimeline(infos)
ok = len(placed or []) == len(infos) and all(p.GetDuration() is not None for p in placed)
result = [(i.GetName(), i.GetStart(), i.GetDuration()) for i in tl.GetItemListInTrack("video", 1)]
```

`ImportMedia` imports into the current bin, so call `mp.SetCurrentFolder(bin)` first. Pass plain path
strings. Use `tl.AddTrack("video")` or `tl.AddTrack("audio", "stereo")` before appending to a track
that doesn't exist yet.

### Titles

Give each title its own timeline, then place that timeline like a clip. You choose the track and the
length, and nothing on V1 moves.

```python
mp = project.GetMediaPool()
mp.SetCurrentFolder(titles_bin)                     # timelines land in the current bin
title_tl = mp.CreateEmptyTimeline("title Kapstadt") # None if taken: skip to placing the existing one
project.SetCurrentTimeline(title_tl)
item = title_tl.InsertFusionTitleIntoTimeline("Text+")          # 5 s inside the title timeline
text = list(item.GetFusionCompByIndex(1).GetToolList(False, "TextPlus").values())[0]
text.SetInput("StyledText", "Kapstadt")

project.SetCurrentTimeline(main)
if main.GetTrackCount("video") < 2:
    main.AddTrack("video")
placed = mp.AppendToTimeline([{"mediaPoolItem": title_tl.GetMediaPoolItem(),
                               "startFrame": 0, "endFrame": 50,  # the length you want on main
                               "mediaType": 1, "trackIndex": 2,
                               "recordFrame": main.GetStartFrame() + 12}])
ok = len(placed or []) == 1 and placed[0].GetDuration() is not None
```

A static Text+ title shows for the whole placed length: 8 s placed from a 5 s title stayed visible
to the end. Check with `get_image` on source `timeline`. Every placement of `title Kapstadt` shows
the same text, so use one timeline per distinct title.
`placed[0].GetMediaPoolItem().GetTimeline()` retrieves the title timeline; make it current before
editing it.

### Replace a re-rendered graphic or overlay

Render each revision to a new file (`title-v3.mov`), then call `pool_item.ReplaceClip(path)`. Its
timeline items stay in place.

- `ReplaceClip` changes the pool item, so every timeline that uses it changes. If only one edit should
  change, import the new file as a separate pool item and use it there.
- If you overwrite the same file path, Resolve keeps showing the frames it already cached.

### Copy a grade

Within a project, `source_item.CopyGrades(target_items)` takes a flat list of timeline items and
copies the current node-stack layer's grade to each, replacing theirs.

To carry a grade out of the project, export a DRX still:

```python
resolve.OpenPage("color")
project.SetCurrentTimeline(tl); tl.SetCurrentTimecode(source_timecode)   # playhead on the source clip
still = tl.GrabStill()
project.GetGallery().GetCurrentStillAlbum().ExportStills([still], export_dir, "look", "drx")
target.GetNodeGraph().ApplyGradeFromDRX(drx_path, 0)    # 0 = no keyframes; replaces the grade
```

`ExportStills` picks the file name (for example `look_1.1.1.drx`). List `export_dir` from the shell
and pass that path as `drx_path`.

`Timeline.ApplyGradeFromDRX` no longer exists. If `ExportStills` returns False, stop the DRX
transfer: `ExportCurrentFrameAsStill` only gives a picture, not a grade. Verify with
`describe_grade` and `get_image`. `SetCDL` has no getter, and a `NodeIndex` beyond the graph returns
False.

### Audio levels, transitions, fades, speed

```python
voice_item.SetProperties({"AudioVolume": 0.0})      # dB; GetProperties() lists AudioPan, voice isolation...
music_item.SetProperties({"AudioVolume": -12.0})
item.AddTransition({"type": "Cross Dissolve", "category": "simple",
                    "position": "end", "alignment": "center", "duration": 12})  # None without handles
item.SetFades({"FadeIn": 0, "FadeOut": 10})
item.SetSpeed({"Percentage": 50.0, "RippleTimeline": False})  # keeps the item's duration
```

Track-level effects and EQ are not scriptable.

### Render a range

```python
page = resolve.GetCurrentPage()
before = project.GetCurrentRenderFormatAndCodec()   # no getter exists for the other settings
project.SetCurrentTimeline(tl)
assert project.LoadRenderPreset("H.264 Master")     # resets state an earlier preset left behind
assert project.SetCurrentRenderFormatAndCodec("mp4", "H264")   # ids, not descriptions ("H.264" fails)
s = tl.GetStartFrame()
assert project.SetRenderSettings({"TargetDir": out_dir, "CustomName": "chapter-1 v2",
                                  "SelectAllFrames": False, "MarkIn": s + 25, "MarkOut": s + 74})
job = project.AddRenderJob()
project.StartRendering([job], False)
```

1. Poll `project.GetRenderJobStatus(job)` in short `run_script` calls (`import time` works; pass
   `timeout` up to 60), with an overall deadline that suits the range. The job is finished only when
   `JobStatus` is Complete, Failed or one of the Cancelled states. Read `status.get("Error")` on
   failure. A job still Ready about 10 s after the start did not start. At the deadline, report the
   job and its status, and leave an active job alone.
2. Prove the result with the file: `ffprobe` its streams, frame count and size.
3. Once the job has finished, or never left Ready, clean up: `project.DeleteRenderJob(job)`,
   `project.SetCurrentRenderFormatAndCodec(before["format"], before["codec"])` and
   `resolve.OpenPage(page)`. Tell the user which other Deliver settings changed.

`GetRenderCodecs(fmt)` maps a description to its id, and `GetAudioRenderFormats()` lists the
audio-only formats.

### Test fixture

Generate clips in a scratch directory with ffmpeg: `testsrc2` with `sine` for a moving picture, and
a solid `color=c=red` clip for cache tests. Work in an `_mcp-<topic>` project and delete it afterwards.

## Verified traps (21.2.0.6)

- `hasattr(obj, anything)` is True; calling a made-up method raises TypeError. Use `in dir(obj)`.
- Unknown keys in `SetProperties`/`SetSettings` return False. Inspector keyframes can override a
  property that reads back correctly, so check the frame.
- Clip colours and marker colours are different sets (`ClipColor` and `MarkerColor` in the stubs).
  "Red" fails for a clip and works for a marker. A second marker on an occupied frame returns False.
- In a batch, `StartRendering` returned True while one job stayed Ready. Alone, the same job
  returned False.
- WAV clips report the project frame rate as FPS, and their append frames count in it.
- A `run_script_unsafe` call that hit the 60 s limit (importing images and appending ~20 items)
  left Resolve quit; the saved project was intact after `launch_resolve` and `LoadProject`. Split
  long jobs into calls that each finish well inside the limit (for example, import first, build
  second), and save after each.
- Scalable item properties: `Scaling` (`resolve.SCALE_FIT`, `SCALE_FILL`, ...) and
  `DynamicZoomEnabled`/`DynamicZoomEase` set via `SetProperties`; the default dynamic zoom is a
  zoom-out of roughly 15–20 %. Its start and end rectangles are not exposed.
- Stills (JPEG/HEIC photos) report 24 fps, and `Start`/`End` come from the file name's number
  (`IMG_8816.jpeg` starts at frame 8816). `AppendToTimeline` reads `startFrame`/`endFrame` at those
  24 fps, so convert: `end = round(timeline_frames * 24 / timeline_fps)` (a 90-frame hold at 29.97
  lands at 89 frames).
- A freshly imported still ignores `startFrame`/`endFrame` when `recordFrame` is given and gets the
  default still duration (5 s), until its `Out` clip property has been set once:
  `clip.SetClipProperty("Out", "")` before appending makes the range count.
- AI analysis (`AnalyzeForIntellisearch`, `AnalyzeForSlate`) returns False when its Extras pack
  is missing.
- No API creates a project library. `SetCurrentDatabase` only switches, and it closes the open project.

## Reported elsewhere, not yet checked on 21.2

These come from the `samuelgursky/davinci-resolve-mcp` limitations ledger (builds 19.1 to 21.1).
Treat them as hypotheses; once one has been checked on this build, move it to the verified list.

- `SaveProject()` on the never-saved "Untitled Project" can hang on a Save As dialog.
- Closing or deleting a project during a render can wedge rendering until Resolve restarts. Call
  `StopRendering` and wait for it to finish first.
- Opening a page while playback runs can hang later calls.
- Returned items can go stale after destructive edits. Re-fetch them from the track list.
- Placements from an errored append batch can vanish on save. Re-count after saving a large batch.
- A Fusion `SetInput` made between `comp.Lock()` and `Unlock()` can read back without being rendered.
- `GetRenderJobStatus()["JobStatus"]` is localized. The output file is the proof.
- Appending SRT subtitles has crashed Resolve 21.1. Import subtitles through the UI.
