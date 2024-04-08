local plugins = {
  {
    "ThePrimeagen/harpoon",
    branch = "harpoon2",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-telescope/telescope.nvim",
    },
    config = function()
      local harpoon = require("harpoon")
      harpoon:setup()
      local conf = require("telescope.config").values
      local function toggle_telescope(harpoon_files)
        local file_paths = {}
        for _, item in ipairs(harpoon_files.items) do
          table.insert(file_paths, item.value)
        end

        require("telescope.pickers").new({}, {
          prompt_title = "Harpoon",
          finder = require("telescope.finders").new_table({
            results = file_paths,
          }),
          previewer = conf.file_previewer({}),
          sorter = conf.generic_sorter({}),
        }):find()
      end

      vim.keymap.set("n", "<leader>ml", function() toggle_telescope(harpoon:list()) end,
        { desc = "List harpoon marks" })
    end
  },
  {
    "folke/noice.nvim",
    event = "VeryLazy",

    opts = {
      lsp = {
        hover = {
          enabled = false
        },
        signature = {
          enabled = false
        },
      },
    },
    dependencies = {
      "MunifTanjim/nui.nvim",
      "rcarriga/nvim-notify",
    }
  },
  {
    lazy = false,
    "github/copilot.vim"
  },
  {
    "nvim-telescope/telescope.nvim",
    dependencies = {
      "nvim-telescope/telescope-live-grep-args.nvim",
      "nvim-telescope/telescope-project.nvim",
      "nvim-telescope/telescope-file-browser.nvim",
      "ANGkeith/telescope-terraform-doc.nvim",
      version = "^1.0.0",
    },
    opts = function()
      require "configs.telescope"
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
      require "nvchad.configs.treesitter"
      require "configs.treesitter"
    end,
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
      require ("nvchad.configs.lspconfig").defaults()
      require "configs.lspconfig"
    end,
  },
  {
    "nvimtools/none-ls.nvim",
    ft = { "go", "terraform", "tf", "terraform-vars", "hcl" },
    dependencies = "nvim-lua/plenary.nvim",
    opts = function()
      return require "configs.null-ls"
    end,
  },
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