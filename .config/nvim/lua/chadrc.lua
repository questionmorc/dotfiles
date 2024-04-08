---@type ChadrcConfig
local M = {}

M.ui = {
  theme = 'catppuccin',
  -- nvdash = { load_on_startup = true}
}
M.plugins = 'plugins'
M.mappings = require 'mappings'
-- vim.pretty_print(M.plugins)
return M
