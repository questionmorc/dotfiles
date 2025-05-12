local lib = require("mrrc.library")

-- vim.keymap.set('n', '<leader>rsfd', function()
--   lib.run_command_toggleterm("spacectl", { "stack", "local-preview", "--id", "firmware-development" })
-- end, { noremap = true, silent = true, desc = "Run local-preview for firmware-development" })

-- vim.keymap.set('n', '<leader>rsmd', function()
--   lib.run_command_toggleterm("spacectl", { "stack", "local-preview", "--id", "machine-cloud-development" })
-- end, { noremap = true, silent = true, desc = "Run local-preview for machine-cloud-development" })

-- vim.keymap.set('n', '<leader>rsmd', function()
--   lib.run_spacelift_stack("machine-cloud-development")
-- end, { noremap = true, silent = true, desc = "Run local-preview for machine-cloud-development" })

vim.keymap.set('n', '<leader>rsd', function()
  lib.select_and_execute(lib.run_spacelift_stack, { "Option1", "Option2", "Option3" })
end, { noremap = true, silent = true, desc = "Run local-preview for development" })

vim.keymap.set('n', '<leader>rsp', function()
  lib.select_and_execute(lib.run_spacelift_stack, { "Option1", "Option2", "Option3" })
end, { noremap = true, silent = true, desc = "Run local-preview for prod" })

vim.keymap.set('n', '<leader>rr', function()
  lib.run_cached()
end, { noremap = true, silent = true, desc = "Run last command again" })
