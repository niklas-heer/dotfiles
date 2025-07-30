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

local function setWindowFloatingAndResize(window)
    -- Tell Amethyst to float current window
    hs.eventtap.keyStroke({ 'ctrl', 'alt', 'shift' }, 'f')

    -- 3. Now resize the window (same as before)
    local screen = window:screen()
    local frame = screen:frame()
    local width = 1400
    local height = 960
    local x = frame.x + (frame.w - width) / 2
    local y = frame.y + (frame.h - height) / 2

    window:setFrame({ x = x, y = y, w = width, h = height })
end

-- Define your mappings
local mappings = {
    -- (G)oto an application
    {
        mods = hyper,
        key = "g",
        name = "Go to Application",
        actions = {
            t = mu.app("Ghostty", "💻 Terminal"),
            b = mu.app("Arc", "🌐 Browser"),
            c = mu.app("Zed", "⚡ Code editor"),
            f = mu.app("Finder", "📁 Files"),
            d = mu.app("Discord", "💬 Discord"),
            v = mu.app("ProtonVPN", "🔒 VPN"),
            s = mu.app("Slack", "💼 Slack"),
            m = mu.app("Spotify", "🎵 Music")
        }
    },
    -- (R)aycast modal
    {
        mods = hyper,
        key = "r",
        name = "Raycast Commands",
        actions = {
            t = mu.url("raycast://confetti", "🎉 Tada"),
            e = mu.url("raycast://extensions/raycast/emoji-symbols/search-emoji-symbols", "😀 Emoji"),
            g = mu.url("raycast://extensions/ricoberger/gitmoji/gitmoji", "🎨 Gitmoji"),
            a = mu.url("raycast://extensions/raycast/raycast-ai/ai-chat", "🤖 AI Chat"),
            c = mu.url("raycast://extensions/raycast/clipboard-history/clipboard-history", "📋 Clipboard history"),
            s = mu.url("raycast://extensions/raycast/system/sleep", "😴 Sleep mode"),
            r = mu.url("raycast://extensions/moored/git-repos/list", "📚 Repos"),
            f = mu.url("raycast://extensions/raycast/raycast-focus/start-focus-session?Goal=Pomodoro", "🍅 Focus session"),
            q = mu.url("raycast://extensions/rolandleth/kill-process/index", "❌ Quit an application")
        }
    },
    -- Clean(S)hot
    -- https://cleanshot.com/docs-api
    {
        mods = hyper,
        key = "s",
        name = "CleanShot Capture",
        actions = {
            a = mu.url("cleanshot://all-in-one", "📸 All-in-one mode"),
            c = mu.url("cleanshot://capture-area", "✂️ Capture area mode"),
            w = mu.url("cleanshot://capture-window", "🪟 Capture window mode"),
            t = mu.url("cleanshot://capture-text", "🔍 Text recognition mode"),
        }
    },
    -- (T)odoist
    -- https://developer.todoist.com/guides/#desktop-app-url-schemes
    {
        mods = hyper,
        key = "t",
        name = "Todoist Tasks",
        actions = {
            a = mu.url("todoist://openquickadd", "➕ Add task"),
            t = mu.url("todoist://today", "📅 Today view"),
        }
    },
    -- (F)unctions
    {
        mods = hyper,
        key = "f",
        name = "Custom Functions",
        actions = {
            r = {
                handler = function(target)
                    local text = escapeQuotes(current_selection())
                    hs.task.new('/bin/bash', nil, function() end, {
                        '-c', ('~/.hammerspoon/scripts/tts.jxa "%s"'):format(text)
                    }):start()
                end,
                description = "🔊 Read selected text aloud"
            },
            p = {
                handler = function(target)
                    local focusedWindow = hs.window.focusedWindow()
                    if focusedWindow then
                        setWindowFloatingAndResize(focusedWindow)
                    else
                        print("No window is currently focused.")
                    end
                end,
                description = "🎯 Present mode (float & resize)"
            },
            f = mu.keystroke({ 'ctrl', 'alt', 'shift' }, 'f', "🪟 Toggle floating mode")
        }
    }
}

-- Create all modals
for _, config in ipairs(mappings) do
    mu.createModal(config.mods, config.key, config.actions, config.name)
end
