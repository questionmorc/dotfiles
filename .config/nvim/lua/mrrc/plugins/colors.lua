-- function ColorMyPencils(color)
--     color = color or "tokyonight"
--     vim.cmd.colorscheme(color)
--
--     vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
--     vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
-- end
--
-- return { "catppuccin/nvim", name = "catppuccin", priority = 1000 }
return {
  {
    "folke/tokyonight.nvim",
    -- name = "tokyonight-mrrc",
    lazy = false,
    priority = 1000,
    config = function()
      require("tokyonight").setup({
        -- style = "storm",
        --
        -- transparent = true,     -- Enable this to disable setting the background color
        terminal_colors = true, -- Configure the colors used when opening a `:terminal` in Neovim
        styles = {
          -- Style to be applied to different syntax groups
          -- Value is any valid attr-list value for `:help nvim_set_hl`
          comments = { italic = false },
          keywords = { italic = false },
          -- Background styles. Can be "dark", "transparent" or "normal"
          sidebars = "dark", -- style for sidebars, see below
          floats = "dark",   -- style for floating windows
        },
        on_highlights = function(hl, c)
          local prompt = "#2d3149"
          hl.TelescopeNormal = {
            bg = c.bg_dark,
            fg = c.fg_dark,
          }
          hl.TelescopeBorder = {
            bg = c.bg_dark,
            fg = c.bg_dark,
          }
          hl.TelescopePromptNormal = {
            bg = prompt,
          }
          hl.TelescopePromptBorder = {
            bg = prompt,
            fg = prompt,
          }
          hl.TelescopePromptTitle = {
            bg = prompt,
            fg = prompt,
          }
          hl.TelescopePreviewTitle = {
            bg = c.bg_dark,
            fg = c.bg_dark,
          }
          hl.TelescopeResultsTitle = {
            bg = c.bg_dark,
            fg = c.bg_dark,
          }
        end,
      })

      vim.cmd.colorscheme("tokyonight-moon")
      -- vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
      -- vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
    end
    --         -- your configuration comes here
    --         -- or leave it empty to use the default settings
    --         style = "storm",        -- The theme comes in three styles, `storm`, `moon`, a darker variant `night` and `day`
    --     })
    -- end
  },

  -- {
  --     "rose-pine/neovim",
  --     name = "rose-pine",
  --     config = function()
  --         require('rose-pine').setup({
  --             disable_background = true,
  --         })
  --
  --         vim.cmd("colorscheme rose-pine")
  --
  --         ColorMyPencils()
  --     end
  -- },


}
