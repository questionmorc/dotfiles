return {
  "neovim/nvim-lspconfig",
  dependencies = {
    "williamboman/mason.nvim",
    "williamboman/mason-lspconfig.nvim",
    -- "hrsh7th/cmp-nvim-lsp",
    "j-hui/fidget.nvim",
    'saghen/blink.cmp',

  },

  config = function()
    -- local cmp_lsp = require("cmp_nvim_lsp")
    -- local capabilities = vim.tbl_deep_extend(
    --   "force",
    --   {},
      -- vim.lsp.protocol.make_client_capabilities(),
    --   cmp_lsp.default_capabilities())
    local capabilities = require('blink.cmp').get_lsp_capabilities()
    require("fidget").setup({})
    require("mason").setup()
    require("mason-lspconfig").setup({
      ensure_installed = {
        "lua_ls",
        "rust_analyzer",
        "ansiblels",
        "bashls",
        "dockerls",
        "docker_compose_language_service",
        "gopls",
        -- "rnix",
        "pylsp",
        -- "nixd",
        -- "ruby_lsp",
        -- "golangci_lint_ls",
        "helm_ls",
        "jsonls",
        -- "tsserver",
        "jsonnet_ls",
        "ts_ls",
        "jqls",
        "terraformls",
        "yamlls",
      },

      handlers = {
        function(server_name) -- default handler (optional)
          require("lspconfig")[server_name].setup {
            capabilities = capabilities
          }
        end,

        lua_ls = function()
          local lspconfig = require("lspconfig")
          lspconfig.lua_ls.setup {
            capabilities = capabilities,
            settings = {
              Lua = {
                diagnostics = {
                  globals = { "vim", "it", "describe", "before_each", "after_each" },
                }
              }
            }
          }
        end,
      },
      vim.diagnostic.config({
        -- update_in_insert = true,
        float = {
          focusable = false,
          style = "minimal",
          border = "rounded",
          source = "always",
          header = "",
          prefix = "",
        },
      })
    })
  end
}
