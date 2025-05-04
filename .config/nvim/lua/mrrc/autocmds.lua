local augroup = vim.api.nvim_create_augroup
local MrrcGroup = augroup('mrrc', {})

local autocmd = vim.api.nvim_create_autocmd
local yank_group = augroup('HighlightYank', {})

function R(name)
  require("plenary.reload").reload_module(name)
end

vim.filetype.add({
  extension = {
    templ = 'templ',
  }
})

autocmd('TextYankPost', {
  group = yank_group,
  pattern = '*',
  callback = function()
    vim.highlight.on_yank({
      higroup = 'IncSearch',
      timeout = 40,
    })
  end,
})

-- autocmd({ "BufWritePre" }, {
--     group = MrrcGroup,
--     pattern = "*",
--     command = [[%s/\s\+$//e]],
-- })
--
autocmd('LspAttach', {
  group = MrrcGroup,
  callback = function(e)
    local opts = { buffer = e.buf }
    vim.keymap.set("n", "gd", function() vim.lsp.buf.definition() end,
      vim.tbl_extend("force", opts, { desc = "Go to definition" }))
    vim.keymap.set("n", "K", function() vim.lsp.buf.hover() end,
      vim.tbl_extend("force", opts, { desc = "Show hover information" }))
    vim.keymap.set("n", "<leader>vws", function() vim.lsp.buf.workspace_symbol() end,
      vim.tbl_extend("force", opts, { desc = "Search workspace symbols" }))
    vim.keymap.set("n", "<leader>vd", function() vim.diagnostic.open_float() end,
      vim.tbl_extend("force", opts, { desc = "Show diagnostics in a floating window" }))
    vim.keymap.set("n", "<leader>vca", function() vim.lsp.buf.code_action() end,
      vim.tbl_extend("force", opts, { desc = "Show available code actions" }))
    vim.keymap.set("n", "<leader>vrr", function() vim.lsp.buf.references() end,
      vim.tbl_extend("force", opts, { desc = "List references to the symbol under the cursor" }))
    vim.keymap.set("n", "<leader>vrn", function() vim.lsp.buf.rename() end,
      vim.tbl_extend("force", opts, { desc = "Rename the symbol under the cursor" }))
    vim.keymap.set("i", "<C-h>", function() vim.lsp.buf.signature_help() end,
      vim.tbl_extend("force", opts, { desc = "Show signature help" }))
    vim.keymap.set("n", "[d", function() vim.diagnostic.goto_next() end,
      vim.tbl_extend("force", opts, { desc = "Go to the next diagnostic" }))
    vim.keymap.set("n", "]d", function() vim.diagnostic.goto_prev() end,
      vim.tbl_extend("force", opts, { desc = "Go to the previous diagnostic" }))
  end
})

