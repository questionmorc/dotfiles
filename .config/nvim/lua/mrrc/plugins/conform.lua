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
        svelte = { "prettierd" },
        javascript = { "prettierd" },
        typescript = { "prettierd" },
        javascriptreact = { "prettierd" },
        typescriptreact = { "prettierd" },
        json = { "prettierd" },
        graphql = { "prettierd" },
        java = { "google-java-format" },
        ruby = { "standardrb" },
        hcl = { "terraform_fmt" },
        markdown = { "prettierd" },
        erb = { "htmlbeautifier" },
        html = { "htmlbeautifier" },
        bash = { "beautysh" },
        sh = { "beautysh" },
        proto = { "buf" },
        rust = { "rustfmt" },
        yaml = { "prettierd" },
        toml = { "taplo" },
        css = { "prettierd" },
        scss = { "prettierd" },
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
