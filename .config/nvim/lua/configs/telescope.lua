-- local telescope = require("telescope")
local lga_actions = require("telescope-live-grep-args.actions")
local conf = require "plugins.configs.telescope"

local extensions = {
  "live_grep_args",
  "project",
  "file_browser",
  "terraform_doc",
}

for _, extension in ipairs(extensions) do
  table.insert(conf.extensions_list, extension)
end

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
