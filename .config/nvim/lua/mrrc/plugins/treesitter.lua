return {
  "nvim-treesitter/nvim-treesitter",
  lazy = false,
  build = ":TSUpdate",
  config = function()
    -- Setup nvim-treesitter with minimal config (only install_dir is configurable)
    require("nvim-treesitter").setup({
      install_dir = vim.fn.stdpath('data') .. '/site'
    })

    -- Install parsers asynchronously (will auto-install on first use)
    local parsers = {
      "awk",
      "bash",
      "c",
      "c_sharp",
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
      "helm",
      "http",
      "java",
      "javascript",
      "jq",
      "json",
      "jsonnet",
      "lua",
      "make",
      "markdown",
      "markdown_inline",
      "nix",
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
    }

    -- Install parsers in background (non-blocking)
    vim.defer_fn(function()
      require("nvim-treesitter").install(parsers)
    end, 100)

    -- Enable treesitter-based indentation
    vim.api.nvim_create_autocmd("FileType", {
      pattern = "*",
      callback = function()
        vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
      end,
    })

    -- Highlighting is automatically enabled via vim.treesitter.start() in Neovim
    -- Additional vim regex highlighting for markdown
    vim.api.nvim_create_autocmd("FileType", {
      pattern = "markdown",
      callback = function()
        vim.opt_local.syntax = "on"
      end,
    })

    -- vim.treesitter.language.register("templ", "templ")
  end
}
