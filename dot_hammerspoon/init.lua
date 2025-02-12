-- general config
local hyper = { "cmd", "alt", "shift", "ctrl" }

-- Reloads the Hammerspoon config automatically
-- ref: https://www.hammerspoon.org/Spoons/ReloadConfiguration.html
hs.loadSpoon("ReloadConfiguration")
spoon.ReloadConfiguration:start()

-- Global mic muted
-- ref: https://www.hammerspoon.org/Spoons/MicMute.html
hs.loadSpoon("MicMute")
spoon.MicMute:bindHotkeys({ toggle = { hyper, "m" } }, 0.75)


local mu = require("modal_utils") -- (m)odal (u)tils

-- Define your mappings
local mappings = {
    -- Apps modal
    {
        mods = hyper,
        key = "g",
        actions = {
            t = mu.app("Ghostty"),   -- (t)erminal
            b = mu.app("Arc"),       -- (b)rowser
            c = mu.app("Zed"),       -- (c)ode editor
            f = mu.app("Finder"),    -- (f)iles
            d = mu.app("Discord"),   -- (d)iscord
            v = mu.app("ProtonVPN"), -- (v)pn
            s = mu.app("Slack"),     -- (s)lack
            m = mu.app("Spotify"),   -- (m)usic
        }
    },
    -- Raycast modal
    {
        mods = hyper,
        key = "r",
        actions = {
            t = mu.url("raycast://confetti"),                                                          -- (t)ada 🎉
            e = mu.url("raycast://extensions/raycast/emoji-symbols/search-emoji-symbols"),             -- (e)moji
            g = mu.url("raycast://extensions/ricoberger/gitmoji/gitmoji"),                             -- (g)itmoji
            a = mu.url("raycast://extensions/raycast/raycast-ai/ai-chat"),                             -- (a)i
            c = mu.url("raycast://extensions/raycast/clipboard-history/clipboard-history"),            -- (c)lipboard-history
            s = mu.url("raycast://extensions/raycast/system/sleep"),                                   -- (s)leep mode
            r = mu.url("raycast://"),                                                                  -- (r)aycast
            f = mu.url("raycast://extensions/raycast/raycast-focus/start-focus-session?Goal=Pomodoro") -- (f)ocus session
        }
    }
}

-- Create all modals
for _, config in ipairs(mappings) do
    mu.createModal(config.mods, config.key, config.actions)
end
