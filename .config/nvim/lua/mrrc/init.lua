vim.g.mapleader = " "
vim.g.netrw_browse_split = 0
vim.g.netrw_banner = 0
vim.g.netrw_winsize = 25
require("mrrc.lazy-init")
require("mrrc.settings")
require("mrrc.keymaps")
require("mrrc.autocmds")
require("mrrc.usercmds")
-- require("mrrc.runmaps")

if jit.os == "OSX" then
  print("Running on macOS")
  -- require("mrrc.wrrk")
  require("mrrc.wrrk.runmaps")
end
