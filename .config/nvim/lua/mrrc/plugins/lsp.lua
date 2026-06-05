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

    -- per-server config (mason-lspconfig v2: no handlers table)
    vim.lsp.config('*', { capabilities = capabilities })

    vim.lsp.config('pylsp', {
      capabilities = capabilities,
      settings = {
        pylsp = {
          plugins = {
            autopep8 = { enabled = false },
            yapf = { enabled = false },
            black = { enabled = false },
            pycodestyle = { enabled = false },
            pyflakes = { enabled = false },
            mccabe = { enabled = false },
            pylint = { enabled = false },
            flake8 = { enabled = false },
            pydocstyle = { enabled = false },
            pyls_isort = { enabled = false },
          },
        },
      },
    })

    vim.lsp.config('lua_ls', {
      capabilities = capabilities,
      settings = {
        Lua = {
          diagnostics = {
            globals = { "vim", "it", "describe", "before_each", "after_each" },
          },
        },
      },
    })

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
        -- "csharp_ls@0.19.0",
        -- "autotools_ls",
        -- "nixd",
        -- "ruby_lsp",
        -- "golangci_lint_ls",
        "helm_ls",
        "jsonls",
        "regal",
        -- "tsserver",
        "jsonnet_ls",
        "ts_ls",
        "jqls",
        "copilot",
        "terraformls",
        -- "yamlls",
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
    vim.lsp.enable('csharp_ls')
  end
}
