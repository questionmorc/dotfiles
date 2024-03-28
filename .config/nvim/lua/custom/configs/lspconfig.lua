local on_attach = require("plugins.configs.lspconfig").on_attach
local on_init = require("plugins.configs.lspconfig").on_init
local capabilities = require("plugins.configs.lspconfig").capabilities

local lspconfig = require("lspconfig")
local util = require "lspconfig/util"
local servers = { "terraformls", "jsonnet_ls", "helm_ls" }

for _, lsp in ipairs(servers) do
  lspconfig[lsp].setup {
    on_init = on_init,
    on_attach = on_attach,
    capabilities = capabilities,
  }
end

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
-- lspconfig.terraformls.setup {
--   on_attach = on_attach,
--   capabilities = capabilities,
--   cmd = { "terraform-ls", "serve" },
--   filetypes = { "terraform", "terraform-vars" },
--   root_dir = util.root_pattern(".terraform", ".terraform.lock.hcl"),
-- }
--
-- lspconfig.jsonnet_ls.setup {
--   on_attach = on_attach,
--   capabilities = capabilities,
--   cmd = { "jsonnet-language-server" },
--   filetypes = { "jsonnet", "libsonnet" },
--   root_dir = util.root_pattern("jsonnetfile.json", ".git"),
--   single_file_support = true
-- }
--
-- lspconfig.helm_ls.setup {
--   on_attach = on_attach,
--   capabilities = capabilities,
--   cmd = { "helm_ls", "serve" },
--   filetypes = { "helm" },
--   root_dir = util.root_pattern("Chart.yaml"),
--   single_file_support = true
-- }
--
-- lspconfig.circle_ci_langauge_server.setup {
--   on_attach = on_attach,
--   capabilities = capabilities,
--   single_file_support = true
-- }
