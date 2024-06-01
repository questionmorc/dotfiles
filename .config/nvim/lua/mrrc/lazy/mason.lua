return {
    "williamboman/mason.nvim",
    cmd = { "Mason", "MasonInstall", "MasonInstallAll", "MasonUpdate" },
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
    },
    config = function(_, opts)
        -- dofile(vim.g.base46_cache .. "mason")
        require("mason").setup(opts)

        -- custom nvchad cmd to install all mason binaries listed
        vim.api.nvim_create_user_command("MasonInstallAll", function()
            if opts.ensure_installed and #opts.ensure_installed > 0 then
                vim.cmd("MasonInstall " .. table.concat(opts.ensure_installed, " "))
            end
        end, {})

        vim.g.mason_binaries_list = opts.ensure_installed
    end,
}
