local on_attach = require("nvchad.configs.lspconfig").on_attach
local on_init = require("nvchad.configs.lspconfig").on_init
local capabilities = require("nvchad.configs.lspconfig").capabilities

local lspconfig = require("lspconfig")
local util = require "lspconfig/util"
local servers = {
  "terraformls",
  "helm_ls",
  "bashls",
  "ansiblels",
  -- "jsonnet_ls",
}

for _, lsp in ipairs(servers) do
  lspconfig[lsp].setup {
    on_init = on_init,
    on_attach = on_attach,
    capabilities = capabilities,
  }
end

-- lspconfig.jsonnet_ls.setup {
--   on_attach = on_attach,
--   capabilities = capabilities,
--   cmd = { "jsonnet-language-server" },
--   filetypes = { "jsonnet", "libsonnet" },
--   root_dir = util.root_pattern("jsonnetfile.json", ".git"),
--   single_file_support = true
-- }

lspconfig.gopls.setup {
  on_attach = on_attach,
  capabilities = capabilities,
  cmd = { "gopls" },
  filetypes = { "go", "gomod", "gowork", "gotmpl" },
  root_dir = util.root_pattern("go.work", "go.mod", ".git"),
  settings = {
    gopls = {
      completeUnimported = true,
      usePlaceholders = true,
      analyses = {
        unusedparams = true,
      },
    },
  },
}
