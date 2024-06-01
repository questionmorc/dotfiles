return {

    {
        "nvim-lua/plenary.nvim",
        name = "plenary"
    },
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
    { "lukas-reineke/indent-blankline.nvim", main = "ibl", opts = {} },
    -- 'NvChad/nvim-colorizer.lua',
    --    "eandrju/cellular-automaton.nvim",
    --    "gpanders/editorconfig.nvim",
}
