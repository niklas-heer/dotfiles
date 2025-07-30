-- modal_utils.lua
local M = {}

-- Overlay configuration with Raycast-like glass appearance
local OVERLAY_CONFIG = {
    background_alpha = 0.75,
    text_alpha = 0.95,
    font_size = 16,
    padding = 20,
    item_spacing = 8,
    corner_radius = 15,
    max_width = 480,
    border_width = 1,
    border_alpha = 0.3,
    blur_radius = 40,
    -- Glass-like colors (similar to Raycast)
    bg_color = { red = 0.1, green = 0.1, blue = 0.1 },        -- Dark base with transparency
    border_color = { red = 0.4, green = 0.4, blue = 0.4 },    -- Subtle border
    text_color = { red = 1.0, green = 1.0, blue = 1.0 },      -- Pure white text
    key_bg_color = { red = 0.25, green = 0.25, blue = 0.25 }, -- Subtle key background
    title_color = { red = 1.0, green = 1.0, blue = 1.0 },     -- Pure white title
    escape_color = { red = 1.0, green = 0.4, blue = 0.3 },    -- Light red for escape
    accent_color = { red = 0.3, green = 0.7, blue = 1.0 },    -- Blue accent
    shadow_color = { red = 0.0, green = 0.0, blue = 0.0 }     -- Shadow for depth
}

-- Global overlay canvas
local overlay_canvas = nil



-- Function to create and show the overlay
local function showOverlay(actions, modal_name)
    if overlay_canvas then
        overlay_canvas:delete()
    end

    -- Get screen dimensions
    local screen = hs.screen.mainScreen()
    local screen_frame = screen:frame()

    -- Calculate content
    local items = {}
    table.insert(items, { key = "ESC", desc = "Exit modal", color = OVERLAY_CONFIG.escape_color })

    for key, action in pairs(actions) do
        local desc = action.description or action.target or "Unknown action"
        table.insert(items, { key = key:upper(), desc = desc, color = OVERLAY_CONFIG.text_color })
    end

    -- Calculate overlay dimensions
    local line_height = OVERLAY_CONFIG.font_size + OVERLAY_CONFIG.item_spacing
    local content_height = #items * line_height + OVERLAY_CONFIG.padding * 2 + OVERLAY_CONFIG.padding / 2
    local content_width = OVERLAY_CONFIG.max_width

    -- Position overlay in center of screen
    local overlay_x = screen_frame.x + (screen_frame.w - content_width) / 2
    local overlay_y = screen_frame.y + (screen_frame.h - content_height) / 2

    -- Create canvas
    overlay_canvas = hs.canvas.new({
        x = overlay_x,
        y = overlay_y,
        w = content_width,
        h = content_height
    })

    -- Main glass background with drop shadow
    overlay_canvas:appendElements({
        type = "rectangle",
        action = "fill",
        fillColor = { red = OVERLAY_CONFIG.bg_color.red, green = OVERLAY_CONFIG.bg_color.green, blue = OVERLAY_CONFIG.bg_color.blue, alpha = OVERLAY_CONFIG.background_alpha },
        strokeColor = { red = OVERLAY_CONFIG.border_color.red, green = OVERLAY_CONFIG.border_color.green, blue = OVERLAY_CONFIG.border_color.blue, alpha = OVERLAY_CONFIG.border_alpha },
        strokeWidth = OVERLAY_CONFIG.border_width,
        roundedRectRadii = { xRadius = OVERLAY_CONFIG.corner_radius, yRadius = OVERLAY_CONFIG.corner_radius },
        shadow = {
            color = { red = OVERLAY_CONFIG.shadow_color.red, green = OVERLAY_CONFIG.shadow_color.green, blue = OVERLAY_CONFIG.shadow_color.blue, alpha = 0.3 },
            offset = { h = 2, w = 0 },
            blurRadius = 20
        }
    })

    -- Inner highlight for glass effect
    overlay_canvas:appendElements({
        type = "rectangle",
        action = "stroke",
        strokeColor = { red = 1, green = 1, blue = 1, alpha = 0.1 },
        strokeWidth = 1,
        frame = {
            x = 1,
            y = 1,
            w = content_width - 2,
            h = content_height - 2
        },
        roundedRectRadii = { xRadius = OVERLAY_CONFIG.corner_radius - 1, yRadius = OVERLAY_CONFIG.corner_radius - 1 }
    })

    -- Title
    overlay_canvas:appendElements({
        type = "text",
        text = modal_name or "Modal Commands",
        textFont = "SF Pro Display",
        textSize = OVERLAY_CONFIG.font_size + 2,
        textColor = { red = OVERLAY_CONFIG.title_color.red, green = OVERLAY_CONFIG.title_color.green, blue = OVERLAY_CONFIG.title_color.blue, alpha = OVERLAY_CONFIG.text_alpha },
        textAlignment = "center",
        frame = {
            x = OVERLAY_CONFIG.padding,
            y = OVERLAY_CONFIG.padding / 2,
            w = content_width - OVERLAY_CONFIG.padding * 2,
            h = OVERLAY_CONFIG.font_size + 6
        }
    })

    -- Add command items
    for i, item in ipairs(items) do
        local y_pos = OVERLAY_CONFIG.padding + 26 + (i - 1) * line_height

        -- Key indicator with glass effect
        local key_height = OVERLAY_CONFIG.font_size + 4
        local key_width = 28

        -- Key shadow for depth
        overlay_canvas:appendElements({
            type = "rectangle",
            action = "fill",
            fillColor = { red = 0, green = 0, blue = 0, alpha = 0.1 },
            frame = {
                x = OVERLAY_CONFIG.padding + 1,
                y = y_pos + 1,
                w = key_width,
                h = key_height
            },
            roundedRectRadii = { xRadius = 4, yRadius = 4 }
        })

        -- Key background with glass effect
        overlay_canvas:appendElements({
            type = "rectangle",
            action = "fill",
            fillColor = { red = OVERLAY_CONFIG.key_bg_color.red, green = OVERLAY_CONFIG.key_bg_color.green, blue = OVERLAY_CONFIG.key_bg_color.blue, alpha = 0.4 },
            strokeColor = { red = OVERLAY_CONFIG.border_color.red, green = OVERLAY_CONFIG.border_color.green, blue = OVERLAY_CONFIG.border_color.blue, alpha = 0.3 },
            strokeWidth = 0.5,
            frame = {
                x = OVERLAY_CONFIG.padding,
                y = y_pos,
                w = key_width,
                h = key_height
            },
            roundedRectRadii = { xRadius = 4, yRadius = 4 }
        })

        -- Key highlight
        overlay_canvas:appendElements({
            type = "rectangle",
            action = "stroke",
            strokeColor = { red = 1, green = 1, blue = 1, alpha = 0.08 },
            strokeWidth = 1,
            frame = {
                x = OVERLAY_CONFIG.padding + 1,
                y = y_pos + 1,
                w = key_width - 2,
                h = key_height - 2
            },
            roundedRectRadii = { xRadius = 3, yRadius = 3 }
        })

        -- Key text (properly centered)
        overlay_canvas:appendElements({
            type = "text",
            text = item.key,
            textFont = "SF Pro Text",
            textSize = OVERLAY_CONFIG.font_size - 4,
            textColor = { red = OVERLAY_CONFIG.text_color.red, green = OVERLAY_CONFIG.text_color.green, blue = OVERLAY_CONFIG.text_color.blue, alpha = OVERLAY_CONFIG.text_alpha },
            textAlignment = "center",
            frame = {
                x = OVERLAY_CONFIG.padding,
                y = y_pos + (key_height - (OVERLAY_CONFIG.font_size - 4)) / 2,
                w = key_width,
                h = key_height
            }
        })

        -- Description text with subtle styling
        local desc_color = OVERLAY_CONFIG.text_color
        local desc_alpha = 0.85

        if item.key == "ESC" then
            desc_color = OVERLAY_CONFIG.escape_color
            desc_alpha = 0.9
        end

        overlay_canvas:appendElements({
            type = "text",
            text = item.desc,
            textFont = "SF Pro Text",
            textSize = OVERLAY_CONFIG.font_size - 2,
            textColor = { red = desc_color.red, green = desc_color.green, blue = desc_color.blue, alpha = desc_alpha },
            frame = {
                x = OVERLAY_CONFIG.padding + key_width + 12,
                y = y_pos + (key_height - (OVERLAY_CONFIG.font_size - 2)) / 2,
                w = content_width - OVERLAY_CONFIG.padding * 2 - key_width - 12,
                h = key_height
            }
        })
    end

    -- Show the overlay
    overlay_canvas:show()
end

-- Function to hide the overlay
local function hideOverlay()
    if overlay_canvas then
        overlay_canvas:delete()
        overlay_canvas = nil
    end
end

-- Enhanced modal creation function
function M.createModal(mods, key, actions, modal_name)
    local modal = hs.hotkey.modal.new(mods, key)

    -- Show overlay when modal is entered
    function modal:entered()
        showOverlay(actions, modal_name or ("Modal: " .. key:upper()))
    end

    -- Hide overlay when modal is exited
    function modal:exited()
        hideOverlay()
    end

    modal:bind({}, 'escape', function()
        hideOverlay()
        modal:exit()
    end)

    for k, action in pairs(actions) do
        modal:bind({}, k, function()
            hideOverlay()
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

-- Helper functions for common action types
function M.app(target, description)
    return { handler = hs.application.launchOrFocus, target = target, description = description }
end

function M.url(target, description)
    return { handler = hs.urlevent.openURL, target = target, description = description }
end

function M.keystroke(mods, key, description)
    return {
        handler = function()
            hs.eventtap.keyStroke(mods, key)
        end,
        target = description or "Keystroke action",
        description = description or "Keystroke action"
    }
end

return M
