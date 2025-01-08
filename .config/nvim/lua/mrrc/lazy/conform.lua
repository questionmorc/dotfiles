return {
  "stevearc/conform.nvim",
  event = { "BufReadPre", "BufNewFile" },
  cmd = { "ConformInfo", },
  config = function()
    local conform = require("conform")
    conform.setup({
      formatters = {
        packer_fmt = {
          command = "packer",
          args = { "fmt", "-" },
        },
      },
      formatters_by_ft = {
        lua = { "stylua" },
        go = { "gofmt", "gofumpt" },
        jsonnnet = { "jsonnetfmt" },
        terraform = { "terraform_fmt" },
        svelte = { { "prettierd", "prettier" } },
        javascript = { { "prettierd", "prettier" } },
        typescript = { { "prettierd", "prettier" } },
        javascriptreact = { { "prettierd", "prettier" } },
        typescriptreact = { { "prettierd", "prettier" } },
        json = { { "prettierd", "prettier" } },
        graphql = { { "prettierd", "prettier" } },
        java = { "google-java-format" },
        ruby = { "standardrb" },
        hcl = { "packer_fmt" },
        markdown = { { "prettierd", "prettier" } },
        erb = { "htmlbeautifier" },
        html = { "htmlbeautifier" },
        bash = { "beautysh" },
        sh = { "beautysh" },
        proto = { "buf" },
        rust = { "rustfmt" },
        yaml = { "yamlfix" },
        toml = { "taplo" },
        css = { { "prettierd", "prettier" } },
        scss = { { "prettierd", "prettier" } },
        ansible = { "ansible_lint" },
      },
    })
    vim.keymap.set({ "n", "v" }, "<leader>l", function()
      conform.format({
        lsp_fallback = true,
        async = false,
        timeout_ms = 1000,
      })
    end, { desc = "Format file or range (in visual mode)" })
  end
}
