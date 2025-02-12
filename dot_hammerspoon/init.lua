-- https://www.hammerspoon.org/Spoons/ReloadConfiguration.html
-- Reloads the config automatically
hs.loadSpoon("ReloadConfiguration")
spoon.ReloadConfiguration:start()

local hyper = { "cmd", "alt", "shift", "ctrl" }

-- Goto application
local gotoModal = hs.hotkey.modal.new(hyper, "g")

local gotoApps = {
    t = "Ghostty",   -- (t)erminal
    b = "Arc",       -- (b)rowser
    c = "Zed",       -- (c)ode editor
    f = "Finder",    -- (f)iles
    d = "Discord",   -- (d)iscord
    v = "ProtonVPN", -- (v)pn
    s = "Slack",     -- (s)lack
    m = "Spotify",   -- (m)usic
}

for key, app in pairs(gotoApps) do
    gotoModal:bind({}, key, function()
        hs.application.launchOrFocus(app)
        gotoModal:exit()
    end)
end

gotoModal:bind({}, 'escape', function() gotoModal:exit() end)

-- https://www.hammerspoon.org/Spoons/MicMute.html
hs.loadSpoon("MicMute")
spoon.MicMute:bindHotkeys({ toggle = { hyper, "m" } }, 0.75)


-- Raycast
local raycastModal = hs.hotkey.modal.new(hyper, "r")

local raycastURLs = {
    t = "raycast://confetti",                                                          -- (t)ada 🎉
    e = "raycast://extensions/raycast/emoji-symbols/search-emoji-symbols",             -- (e)moji
    g = "raycast://extensions/ricoberger/gitmoji/gitmoji",                             -- (g)itmoji
    a = "raycast://extensions/raycast/raycast-ai/ai-chat",                             -- (a)i
    c = "raycast://extensions/raycast/clipboard-history/clipboard-history",            -- (c)lipboard-history
    s = "raycast://extensions/raycast/system/sleep",                                   -- (s)leep mode
    r = "raycast://",                                                                  -- (r)eset raycast
    f = "raycast://extensions/raycast/raycast-focus/start-focus-session?Goal=Pomodoro" -- (f)ocus session
}

for key, url in pairs(raycastURLs) do
    raycastModal:bind({}, key, function()
        hs.urlevent.openURL(url)
        raycastModal:exit()
    end)
end

raycastModal:bind({}, 'escape', function() raycastModal:exit() end)
