return {
  {
    'abecodes/tabout.nvim',
    lazy = false,
    config = function()
      require('tabout').setup {
        tabkey = '<C-l>',            -- key to trigger tabout, set to an empty string to disable
        backwards_tabkey = '<C-h>',  -- key to trigger backwards tabout, set to an empty string to disable
        act_as_tab = false,          -- shift content if tab out is not possible
        act_as_shift_tab = false,    -- reverse shift content if tab out is not possible (if your keyboard/terminal supports <S-Tab>)
        default_tab = '<C-t>',       -- shift default action (only at the beginning of a line, otherwise <TAB> is used)
        default_shift_tab = '<C-d>', -- reverse shift default action,
        enable_backwards = true,     -- well ...
      }
    end,
    opt = true,              -- Set this to true if the plugin is optional
    event = 'InsertCharPre', -- Set the event to 'InsertCharPre' for better compatibility
    priority = 1000,
  },
}
