return {
  "olimorris/codecompanion.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-treesitter/nvim-treesitter",
    "ravitemer/codecompanion-history.nvim"
  },
  config = function()
    require("codecompanion").setup({
      strategies = {
        chat = {
          adapter = "copilot",
          -- adapter = {
          --   name = "copilot",
          --   model = "gpt-4"
          --   -- model = "claude-3.7-sonnet-thought"
          -- },
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
          -- adapter = {
          --   name = "copilot",
          --   model = "gpt-4"
          --   -- model = "claude-3.7-sonnet-thought"
          -- },
        },
      },
      extensions = {
        history = {
          enabled = true,

        },
        vectorcode = {
          opts = {
            add_tool = true,
          }
        },
        mcphub = {
          callback = "mcphub.extensions.codecompanion",
          opts = {
            show_result_in_chat = true, -- Show mcp tool results in chat
            make_vars = true,           -- Convert resources to #variables
            make_slash_commands = true, -- Add prompts as /slash commands
          }
        }
      }
    })

    vim.api.nvim_set_keymap('n', '<leader>cc', '<cmd>CodeCompanionChat Toggle<CR>',
      { noremap = true, silent = true })

    vim.keymap.set({ "n", "v" }, "<leader>ce", function()
      require("codecompanion").prompt("explain")
    end, { noremap = true, silent = true })

    vim.keymap.set({ "n", "v" }, "<leader>ca", "<cmd>CodeCompanionActions<cr>", { noremap = true, silent = true })
  end


}
