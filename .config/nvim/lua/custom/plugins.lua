local plugins = {
  {
    "ThePrimeagen/vim-be-good",
  },
  {
    "christoomey/vim-tmux-navigator",
    lazy = false
  },
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    opts = function ()
      return require "custom.configs.treesitter"
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
        "gopls"
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
    "jose-elias-alvarez/null-ls.nvim",
    ft = "go",
    opts = function ()
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
    opts = function ()
      return require "custom.configs.fugitive"
    end,
     -- opt = true,
     -- config = function ()
     --   return require "custom.configs.fugitive"
     -- end,
     -- cmd = {
     --   "G", "Git", "Gdiffsplit", "Gvdiffsplit", "Gedit", "Gsplit",
     --   "Gread", "Gwrite", "Ggrep", "Glgrep", "Gmove",
     --   "Gdelete", "Gremove", "Gbrowse",
     -- },
  },
}
return plugins
