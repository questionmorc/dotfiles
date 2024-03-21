-- local telescope = require("telescope")
local lga_actions = require("telescope-live-grep-args.actions")
local project_actions = require("telescope._extensions.project.actions")

local opts = {
  extensions_list = { "themes", "terms", "live_grep_args", "projects"},
  extensions = {
    projects = {},
    live_grap_args = {
      auto_quoting = true,
      mappings = {
        i = {
          ["<C-k>"] = lga_actions.quote_prompt(),
          ["<C-i>"] = lga_actions.quote_prompt({ postfix = " --iglob " }),
        }
      }
    }
  }
}
return opts
