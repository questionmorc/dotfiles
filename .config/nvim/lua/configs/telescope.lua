-- local telescope = require("telescope")
local lga_actions = require("telescope-live-grep-args.actions")
local conf = require "nvchad.configs.telescope"

local extensions = {
  "live_grep_args",
  "project",
  "file_browser",
  "terraform_doc",
}

for _, extension in ipairs(extensions) do
  table.insert(conf.extensions_list, extension)
end

conf.defaults.file_ignore_patterns = {
  "node_modules",
  ".git",
  ".cache",
  -- ".terraform",
  ".serverless",
  ".vscode",
  ".github",
  ".idea",
  ".next",
  ".nuxt",
  ".cache",
  ".history",
  ".logs",
  ".stack-work",
  ".bloop",
  ".metals",
  ".ccls-cache",
  ".clangd",
  ".cquery",
  ".eunit",
  ".gitlab",
  ".hg",
  ".svn",
  ".tox",
  ".venv",
  ".virtualenv",
  ".vscode-test",
  ".yarn",
  ".yarnrc",
  ".yarn-integrity",
  ".yarn-metadata",
  ".yarnignore",
  ".yarn-integrity",
  ".yarnrc",
  ".yarnrc.yml",
  ".yarnrc.yaml",
  ".yarnrc.json",
  ".yarnrc.lock",
  ".yarnpkg",
  ".yarnpkg.yml",
  ".yarnpkg.yaml",
  ".yarnpkg.json",
  ".yarnpkg.lock",
  ".yarnpkg.cache",
  ".yarnpkg-integrity",
  ".yarnpkg-metadata",
  ".yarnpkgignore",
  ".yarnpkg-integrity",
  ".yarnpkgrc",
  ".yarnpkgrc.yml",
  ".yarnpkgrc.yaml",
  ".yarnpkgrc.json",
  ".yarnpkgrc.lock",
  ".yarnpkgrc.cache",
  ".yarnpkgrc-integrity",
  ".yarnpkgrc-metadata",
  ".yarnpkgrcignore",
  ".yarnpkgrc-integrity",
  ".yarnrc.cjs",
  ".yarnrc.mjs",
  ".yarnrc.js",
  ".yarnrc.ts",
  ".yarnrc.tsx",
  ".yarnrc.jsx",
  ".yarnrc.vue",
  ".yarnrc.svelte",
  ".yarnrc.html",
  ".yarnrc.htm",
  ".yarnrc.css",
  ".yarnrc.scss",
  ".yarnrc.sass",
  ".yarnrc.less",
  ".yarnrc.styl",
  ".yarnrc.stylus",
  ".yarnrc.md",
  ".yarnrc.markdown",
  ".yarnrc.rst",
  ".yarnrc.html",
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
        ["<C-a>"] = lga_actions.quote_prompt({ postfix = " --hidden " }),
      }
    }
  }
}
return conf
