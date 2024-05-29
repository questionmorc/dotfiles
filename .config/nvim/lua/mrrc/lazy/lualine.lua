return {
    'nvim-lualine/lualine.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    -- Lua
    config = function()
        require('lualine').setup({
            options = {
                theme = 'tokyonight',
            }
        })
    end,

}
