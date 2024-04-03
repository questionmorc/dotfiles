-- local telescope = require("telescope")
local lga_actions = require("telescope-live-grep-args.actions")
local conf = require "plugins.configs.telescope"
conf.extensions_list = {
  "themes",
  "terms",
  "live_grep_args",
  "project",
  "file_browser",
  "terraform_doc",
}
conf.extensions = {
  projects = {},
  file_browser = {},
  terraform_doc = {
    -- url_open_command = "<cmd> firefox"
  },
  live_grep_args = {
    auto_quoting = true,
    mappings = {
      i = {
        ["<C-k>"] = lga_actions.quote_prompt(),
        ["<C-i>"] = lga_actions.quote_prompt({ postfix = " --iglob " }),
      }
    }
  }
}
return conf
