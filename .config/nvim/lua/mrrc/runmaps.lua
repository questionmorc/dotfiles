local lib = require("mrrc.library")

vim.keymap.set('n', '<leader>rsfd', function()
  lib.run_command_toggleterm("spacectl", { "stack", "local-preview", "--id", "firmware-development" })
end, { noremap = true, silent = true, desc = "Run local-preview for firmware-development" })

vim.keymap.set('n', '<leader>rsmd', function()
  lib.run_command_toggleterm("spacectl", { "stack", "local-preview", "--id", "machine-cloud-development" })
end, { noremap = true, silent = true, desc = "Run local-preview for machine-cloud-development" })
