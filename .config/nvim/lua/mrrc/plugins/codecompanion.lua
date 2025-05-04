return {
  "olimorris/codecompanion.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-treesitter/nvim-treesitter",
  },
  config = function()
    require("codecompanion").setup({
      strategies = {
        chat = {
          adapter = "copilot",
          slash_commands = {
            ["buffer"] = {
              opts = {
                provider = "telescope"
              }
            },

            ["file"] = {
              opts = {
                provider = "telescope"
              }
            }
          }
        },
        inline = {
          adapter = "copilot",
        },
      }
    })

    vim.api.nvim_set_keymap('n', '<leader>cc', '<cmd>CodeCompanionChat Toggle<CR>',
      { noremap = true, silent = true })
  end

}
