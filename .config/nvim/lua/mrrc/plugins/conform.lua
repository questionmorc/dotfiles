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
        go = { "gofmt"},
        -- jsonnnet = { "jsonnetfmt" },
        terraform = { "terraform_fmt" },
        svelte = { "prettier" },
        javascript = { "prettier" },
        typescript = { "prettier" },
        javascriptreact = { "prettier" },
        typescriptreact = { "prettier" },
        json = { "prettier" },
        graphql = { "prettier" },
        -- java = { "google-java-format" },
        -- ruby = { "standardrb" },
        hcl = { "terraform_fmt" },
        markdown = { "prettier" },
        -- erb = { "htmlbeautifier" },
        -- html = { "htmlbeautifier" },
        bash = { "beautysh" },
        -- sh = { "beautysh" },
        -- proto = { "buf" },
        -- rust = { "rustfmt" },
        yaml = { "prettier" },
        -- toml = { "taplo" },
        css = { "prettier" },
        scss = { "prettier" },
        -- ansible = { "ansible_lint" },
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
