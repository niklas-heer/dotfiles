function fish_user_key_bindings
    # Open the searchable completion pager immediately instead of first
    # inserting only the common prefix. Type to filter, Tab/Shift-Tab or the
    # arrow keys to navigate, and Enter to accept.
    bind tab complete-and-search
end
