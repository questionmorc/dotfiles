local plugins = {
  {
    lazy = false,
    "github/copilot.vim"
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
    opts = {
      ensure_installed = {
        "awk",
        "bash",
        "c",
        "csv",
        "diff",
        "dockerfile",
        "git_config",
        "gitcommit",
        "gitignore",
        "go",
        "gomod",
        "graphql",
        "groovy",
        "hcl",
        "html",
        "http",
        "java",
        "javascript",
        "jq",
        "json",
        "lua",
        "make",
        "markdown",
        "markdown_inline",
        "passwd",
        "promql",
        "python",
        "regex",
        "requirements",
        "rust",
        "sql",
        "ssh_config",
        "terraform",
        "toml",
        "typescript",
        "vim",
        "vimdoc",
        "xml",
        "yaml",
      },
      highlight = {
        enable = true,
        additional_vim_regex_highlighting = false,
      }
    }
    -- opts = function()
    --   require "nvchad.configs.treesitter"
    --   require "configs.treesitter"
    -- end,
  },

  --  {
  --    "mbbill/undotree",
  --    lazy = false,
  --    init = function()
  --      require("core.utils").load_mappings("undotree")
  --    end
  --  },
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
        "llm-ls",
        "circleci-yaml-language-server",
        "bash-language-server",
        "beautysh",
        "prettier",
        "prettierd",
        "tflint",
        "buf",
        "htmlbeautifier",
        "rustfmt",
        "yamlfix",
        "taplo",
        'ansible-language-server',
      }
    }
  },
  --  {
  --    "mfussenegger/nvim-dap",
  --    init = function()
  --      require("core.utils").load_mappings("dap")
  --    end
  --  },
  --  {
  --    "dreamsofcode-io/nvim-dap-go",
  --    ft = "go",
  --    dependencies = "mfussenegger/nvim-dap",
  --    config = function(_, opts)
  --      require("dap-go").setup(opts)
  --      require("core.utils").load_mappings("dap_go")
  --    end
  --  },
  {
    "neovim/nvim-lspconfig",
    config = function()
      require("nvchad.configs.lspconfig").defaults()
      require "configs.lspconfig"
    end,
  },
  -- {
  --   "nvimtools/none-ls.nvim",
  --   ft = { "go", "terraform", "tf", "terraform-vars", "hcl" },
  --   dependencies = "nvim-lua/plenary.nvim",
  --   opts = function()
  --     return require "configs.null-ls"
  --   end,
  -- },
  --  {
  --    "olexsmir/gopher.nvim",
  --    ft = "go",
  --    config = function(_, opts)
  --      require("gopher").setup(opts)
  --      require("core.utils").load_mappings("gopher")
  --    end,
  --    build = function()
  --      vim.cmd [[silent! GoInstallDeps]]
  --    end,
  --  },
  {
    "tpope/vim-fugitive",
    lazy = false,
  },
}
return plugins
