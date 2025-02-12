-- https://www.hammerspoon.org/Spoons/ReloadConfiguration.html
-- Reloads the config automatically
hs.loadSpoon("ReloadConfiguration")
spoon.ReloadConfiguration:start()

local hyper = { "cmd", "alt", "shift", "ctrl" }

-- Goto application
local gotoModal = hs.hotkey.modal.new(hyper, "g")

local gotoApps = {
    t = "Ghostty",
    b = "Arc",
    c = "Zed",
    f = "Finder",
    d = "Discord",
    v = "ProtonVPN",
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
