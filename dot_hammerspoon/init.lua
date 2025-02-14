-- general config
local hyper = { "cmd", "alt", "shift", "ctrl" }

-- Reloads the Hammerspoon config automatically
-- ref: https://www.hammerspoon.org/Spoons/ReloadConfiguration.html
hs.loadSpoon("ReloadConfiguration")
spoon.ReloadConfiguration:start()

local mu = require("modal_utils") -- (m)odal (u)tils

-- Internal function to get the currently selected text.
-- It tries through hs.uielement, but if that fails it
-- tries issuing a Cmd-c and getting the pasteboard contents
-- afterwards.
local function current_selection()
    local elem = hs.uielement.focusedElement()
    local sel = nil
    if elem then
        sel = elem:selectedText()
    end
    if (not sel) or (sel == "") then
        hs.eventtap.keyStroke({ "cmd" }, "c")
        hs.timer.usleep(20000)
        sel = hs.pasteboard.getContents()
    end
    return (sel or "")
end

local function escapeQuotes(str)
    return string.gsub(str, '"', '\\"')
end

-- Define your mappings
local mappings = {
    -- (G)oto an application
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
    -- (R)aycast modal
    {
        mods = hyper,
        key = "r",
        actions = {
            t = mu.url("raycast://confetti"),                                                           -- (t)ada 🎉
            e = mu.url("raycast://extensions/raycast/emoji-symbols/search-emoji-symbols"),              -- (e)moji
            g = mu.url("raycast://extensions/ricoberger/gitmoji/gitmoji"),                              -- (g)itmoji
            a = mu.url("raycast://extensions/raycast/raycast-ai/ai-chat"),                              -- (a)i
            c = mu.url("raycast://extensions/raycast/clipboard-history/clipboard-history"),             -- (c)lipboard-history
            s = mu.url("raycast://extensions/raycast/system/sleep"),                                    -- (s)leep mode
            r = mu.url("raycast://extensions/moored/git-repos/list"),                                   -- (r)epos
            f = mu.url("raycast://extensions/raycast/raycast-focus/start-focus-session?Goal=Pomodoro"), -- (f)ocus session
            q = mu.url("raycast://extensions/rolandleth/kill-process/index")                            -- (q)uit an application
        }
    },
    -- Clean(S)hot
    -- https://cleanshot.com/docs-api
    {
        mods = hyper,
        key = "s",
        actions = {
            a = mu.url("cleanshot://all-in-one"),     -- (a)ll-in-one mode
            c = mu.url("cleanshot://capture-area"),   -- (c)apture area mode
            w = mu.url("cleanshot://capture-window"), -- capture (w)indow mode
            t = mu.url("cleanshot://capture-text"),   -- (t)ext recognition mode
        }
    },
    -- (T)odoist
    -- https://developer.todoist.com/guides/#desktop-app-url-schemes
    {
        mods = hyper,
        key = "t",
        actions = {
            a = mu.url("todoist://openquickadd"), -- (a)dd task
            t = mu.url("todoist://today"),        -- (t)oday view
        }
    },
    -- (F)unctions
    {
        mods = hyper,
        key = "f",
        actions = {
            r = {
                handler = function(target)
                    local text = escapeQuotes(current_selection())
                    hs.execute(('~/.hammerspoon/scripts/tts.jxa "%s"'):format(text))
                end,
                target = ""
            }, -- (r)ead text for the current selection
        }
    }
}

-- Create all modals
for _, config in ipairs(mappings) do
    mu.createModal(config.mods, config.key, config.actions)
end
