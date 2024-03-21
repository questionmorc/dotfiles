local plugins = {
  {
    "nvim-telescope/telescope.nvim",
    dependencies = {
      "nvim-telescope/telescope-live-grep-args.nvim",
      version = "^1.0.0",
    },
    -- opts = {
    --   extensions_list = { "themes", "terms", "live_grep_args" }
    -- }

    opts = function()
      require "plugins.configs.telescope"
      require "custom.configs.telescope"
    end,
  },
  {
    "towolf/vim-helm",
    ft = "helm"
  },
  {
    "christoomey/vim-tmux-navigator",
    lazy = false
  },
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    opts = function()
      require "plugins.configs.treesitter"
      require "custom.configs.treesitter"
    end,
  },

  {
    "mbbill/undotree",
    lazy = false,
    init = function()
      require("core.utils").load_mappings("undotree")
    end
  },
  {
    "williamboman/mason.nvim",
    opts = {
      ensure_installed = {
        "gopls",
        "terraform-ls",
        "golangci-lint",
        "golangci-lint-langserver",
        "jsonnet-language-server",
        "lua-language-server ",
        "jsonnetfmt",
        "helm-ls",
      }
    }
  },
  {
    "mfussenegger/nvim-dap",
    init = function()
      require("core.utils").load_mappings("dap")
    end
  },
  {
    "dreamsofcode-io/nvim-dap-go",
    ft = "go",
    dependencies = "mfussenegger/nvim-dap",
    config = function(_, opts)
      require("dap-go").setup(opts)
      require("core.utils").load_mappings("dap_go")
    end
  },
  {
    "neovim/nvim-lspconfig",
    config = function()
      require "plugins.configs.lspconfig"
      require "custom.configs.lspconfig"
    end,
  },
  {
    "nvimtools/none-ls.nvim",
    ft = { "go", "terraform", "tf", "terraform-vars", "hcl" },
    dependencies = "nvim-lua/plenary.nvim",
    opts = function()
      return require "custom.configs.null-ls"
    end,
  },
  {
    "olexsmir/gopher.nvim",
    ft = "go",
    config = function(_, opts)
      require("gopher").setup(opts)
      require("core.utils").load_mappings("gopher")
    end,
    build = function()
      vim.cmd [[silent! GoInstallDeps]]
    end,
  },
  {
    "tpope/vim-fugitive",
    lazy = false,
  },
}
return plugins
