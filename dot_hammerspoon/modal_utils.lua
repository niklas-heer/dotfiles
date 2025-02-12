-- modal_utils.lua
local M = {}

function M.createModal(mods, key, actions)
    local modal = hs.hotkey.modal.new(mods, key)

    modal:bind({}, 'escape', function() modal:exit() end)

    for k, action in pairs(actions) do
        modal:bind({}, k, function()
            if action.handler then
                if action.target then
                    action.handler(action.target)
                else
                    action.handler()
                end
            end
            modal:exit()
        end)
    end

    return modal
end

function M.app(target)
    return { handler = hs.application.launchOrFocus, target = target }
end

function M.url(target)
    return { handler = hs.urlevent.openURL, target = target }
end

-- For reference this is also possible:
--
-- t = { handler = hs.application.launchOrFocus, target = "App" },
-- x = {
--     handler = function(target)
--         -- Do something custom
--         print("Custom action")
--         hs.application.launchOrFocus(target)
--     end,
--     target = "SomeApp"
-- },

return M
