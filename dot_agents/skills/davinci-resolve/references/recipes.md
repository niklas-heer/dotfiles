# Resolve recipes and traps

Each recipe ran on DaVinci Resolve Studio 21.2.0.6 through the official MCP `run_script`. Recheck a
recipe when `resolve.GetVersionString()` reports a different build.

## Recipes

### Place clips and confirm them

```python
mp = project.GetMediaPool()
tl = project.GetCurrentTimeline()
start = tl.GetStartFrame()
fps = float(clip.GetClipProperty("FPS"))           # source frames are in the clip's own rate
placed = mp.AppendToTimeline([{
    "mediaPoolItem": clip,
    "startFrame": int(2 * fps), "endFrame": int(4 * fps),   # end exclusive
    "mediaType": 1, "trackIndex": 1,                         # omit mediaType for video + audio
    "recordFrame": start + 0,                                # absolute timeline frame
}])
dead = [p for p in placed if p.GetDuration() is None]       # nothing was placed for these
result = [(i.GetName(), i.GetStart(), i.GetDuration()) for i in tl.GetItemListInTrack("video", 1)]
```

`ImportMedia` always imports into the current bin: `mp.SetCurrentFolder(bin)` first.
`AddTrack("video")` or `AddTrack("audio", "stereo")` before appending to a track that doesn't exist.

### Put a title on its own track

```python
tl.SetTrackLock("video", 1, False)
fps = float(project.GetSetting("timelineFrameRate"))
def tc(frame):  # absolute frame to timecode, integer frame rates
    f = int(round(fps)); h, r = divmod(int(frame), 3600 * f); m, r = divmod(r, 60 * f); s, fr = divmod(r, f)
    return "%02d:%02d:%02d:%02d" % (h, m, s, fr)
if tl.GetTrackCount("video") < 2:
    tl.AddTrack("video")
tl.SetCurrentTimecode(tc(tl.GetEndFrame()))         # insert where nothing can ripple
title = tl.InsertFusionTitleIntoTimeline("Text+")
tl.MoveItems([title], {"trackIndex": 2, "startFrame": tl.GetStartFrame() + int(0.5 * fps)})
text = list(title.GetFusionCompByIndex(1).GetToolList(False, "TextPlus").values())[0]
text.SetInput("StyledText", "Kapstadt")
```

A Text+ title defaults to 5 seconds (125 frames at 25 fps). Then confirm that V1 still has its old
starts, and look at the frame with `get_image`.
`TimelineItem.SetPosition({"trackIndex": ..., "startFrame": ...})` moves a single item.

### Replace a re-rendered graphic or overlay

Render each revision to a new file (`title-v3.mov`), then
`pool_item.ReplaceClip("/path/title-v3.mov")`. The timeline item stays where it is. If you overwrite
the same path, Resolve keeps showing old frames. `ReplaceClip` on the same path only refreshes frames
that were never cached.

### Copy a grade through a DRX still

```python
resolve.OpenPage("color")
tl.SetCurrentTimecode(source_item_timecode)            # playhead on the graded clip
still = tl.GrabStill()
album = project.GetGallery().GetCurrentStillAlbum()
album.ExportStills([still], export_dir, "look", "drx")  # writes look_<n>.drx
target.GetNodeGraph().ApplyGradeFromDRX(drx_path, 0)    # 0 = no keyframes; replaces the grade
```

Verify with `describe_grade` and `get_image`. `ExportStills` worked from the Color page. A community
report says it needs the Gallery panel open. If it returns False, `project.ExportCurrentFrameAsStill(path)`
gives a frame instead. `SetCDL` has no getter, and a `NodeIndex` beyond the graph returns False.

### Render a range

```python
page = resolve.GetCurrentPage()
project.LoadRenderPreset("H.264 Master")                # reset state left by any earlier preset
project.SetCurrentRenderFormatAndCodec("mp4", "H264")   # ids, not descriptions ("H.264" fails)
s = tl.GetStartFrame()
project.SetRenderSettings({"TargetDir": out_dir, "CustomName": "chapter-1 v2",
                           "SelectAllFrames": False, "MarkIn": s + 25, "MarkOut": s + 74})  # absolute, inclusive
job = project.AddRenderJob()
ok = project.StartRendering([job], False)
resolve.OpenPage(page)
```

Poll `project.GetRenderJobStatus(job)` with `time.sleep` until `JobStatus` is Complete or Failed.
A `run_script` call lasts at most 60 s, so poll a long render across several calls. Then `ffprobe`
the file. Render settings persist in the
project, which changes the user's Deliver page. Restore them or say what changed.
`GetRenderFormats()` maps format to extension and `GetRenderCodecs(fmt)` maps description to id.
`GetAudioRenderFormats()` lists the audio-only formats. Paths with spaces render fine.

### Transitions, fades, speed

```python
item.AddTransition({"type": "Cross Dissolve", "category": "simple",
                    "position": "end", "alignment": "center", "duration": 12})  # needs handles
item.SetFades({"FadeIn": 0, "FadeOut": 10})
item.SetSpeed({"Percentage": 50.0, "RippleTimeline": False})  # keeps the item's duration
```

### Disposable test fixture

Generate media with ffmpeg in a scratch directory:
`ffmpeg -f lavfi -i testsrc2=size=1920x1080:rate=25:duration=10 -f lavfi -i sine=frequency=440:duration=10 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest clip.mp4`.
Use a solid `color=c=red` clip to test caching. Work in an `_mcp-<topic>` project, then delete it.

## Verified traps (21.2.0.6)

- `hasattr(obj, anything)` is True; calling a made-up method raises TypeError. Use `in dir(obj)`.
- `SetProperty` with an unknown key returns False. `ZoomX`/`ZoomY` read back correctly. Keyframed
  Inspector values may still win in the render, so check the frame.
- `SetClipColor` accepts only Resolve's names (Orange, Apricot, Yellow, Lime, Olive, Green, Teal,
  Navy, Blue, Purple, Violet, Pink, Tan, Beige, Brown, Chocolate). "Red" returns False for a clip
  but works as a marker colour.
- Adding a second marker on an occupied frame returns False.
- `SetTrackEnable` works on any page. A community skill said Edit page only, which does not hold here.
- Renaming the active timeline with `SetName` works.
- `StartRendering(job_id)` with a bare string works too. In a batch, `StartRendering` returned True
  while one job stayed Ready. Alone, the same job returned False.
- WAV clips report the project frame rate as FPS, and their append frames count in it.
- AI analysis (`AnalyzeForIntellisearch`, `AnalyzeForSlate`) returns False when its Extras pack
  is missing.
- There is no API to create a project library (database). `GetDatabaseList`/`SetCurrentDatabase`
  only list and switch, and switching closes the open project.

## Reported elsewhere, not yet checked on 21.2

Found in the `samuelgursky/davinci-resolve-mcp` limitations ledger (builds 19.1 to 21.1). Treat
these as hypotheses, and move one up into the verified list once it has been checked on this build.

- `SaveProject()` on the never-saved "Untitled Project" can hang on a Save As dialog.
- Closing or deleting a project during a render wedges rendering until Resolve restarts. Run
  `StopRendering` and wait first.
- If `ProjectManager.GetCurrentDatabase()` returns None, Resolve is wedged. Restart it.
- Opening a page while playback runs can hang every later call.
- Returned items go stale after destructive edits. Re-fetch them from the track list.
- Placements from an errored append batch can vanish on save. Re-count after `SaveProject`.
- `DeleteClips` fails on locked tracks and on the Fairlight page.
- `ImportTimelineFromFile` returns None when the timeline name already exists. FCPXML 1.10 export
  writes a bundle directory.
- `CopyGrades` replaces the target grade and does not merge it.
- A Fusion `SetInput` made between `comp.Lock()` and `Unlock()` reads back but is not rendered.
- `GetRenderJobStatus()["JobStatus"]` is localized. Gate on `CompletionPercentage == 100` plus the file.
- `ArchiveProject` with media flags on crashed Resolve.
- Appending SRT subtitles has crashed Resolve 21.1. Import subtitles through the UI.
