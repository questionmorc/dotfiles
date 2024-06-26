return {
    {
        "christoomey/vim-tmux-navigator",
        lazy = false
    },
    {
        'akinsho/bufferline.nvim',
        version = "*",
        dependencies = 'nvim-tree/nvim-web-devicons',
        config = function()
            require('bufferline').setup({})
        end
    },
    "github/copilot.vim",
    --    "eandrju/cellular-automaton.nvim",
    --    "gpanders/editorconfig.nvim",
}
