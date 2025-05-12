local lib = require("mrrc.library")

vim.keymap.set('n', '<leader>rsd', function()
  lib.select_and_execute(lib.run_spacelift_stack, lib.read_options_from_file("dev-infra-stacks.txt"))
end, { noremap = true, silent = true, desc = "Run local-preview for development" })

vim.keymap.set('n', '<leader>rsp', function()
  lib.select_and_execute(lib.run_spacelift_stack, lib.read_options_from_file("prod-infra-stacks.txt"))
end, { noremap = true, silent = true, desc = "Run local-preview for prod" })

vim.keymap.set('n', '<leader>rr', function()
  lib.run_cached()
end, { noremap = true, silent = true, desc = "Run last command again" })
