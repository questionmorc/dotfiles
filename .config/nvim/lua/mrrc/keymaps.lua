vim.g.mapleader = " "

-- Use ESC to exit terminal mode
vim.keymap.set('t', '<Esc>', [[<C-\><C-n>]])

vim.keymap.set("i", "jk", "<Esc>", { desc = "Esc" })

vim.keymap.set("n", "<leader>pv", vim.cmd.Ex, { desc = "Open netrw" })
-- embedded lua
vim.keymap.set("n", "<space><space>e", "<cmd>source %<CR>", { desc = "Source current file" })
vim.keymap.set("n", "<leader>e", ":.lua<CR>", { desc = "Execute lua in current file" })
vim.keymap.set("v", "<leader>e", ":lua<CR>", { desc = "Execute lua on current line" })

vim.keymap.set({ "n" }, "<C-h>", "<cmd> TmuxNavigateLeft<CR>", { desc = "TmuxNavigator window left" })
vim.keymap.set({ "n" }, "<C-l>", "<cmd> TmuxNavigateRight<CR>", { desc = "TmuxNavigator window right" })
vim.keymap.set({ "n" }, "<C-j>", "<cmd> TmuxNavigateDown<CR>", { desc = "TmuxNavigator window down" })
vim.keymap.set({ "n" }, "<C-k>", "<cmd> TmuxNavigateUp<CR>", { desc = "TmuxNavigator window up" })

-- buffers
vim.keymap.set("n", "<leader>x", ':bd<CR>', { desc = "Close current buffer", silent = true })
vim.keymap.set("n", "<tab>", ':bn<CR>', { desc = "Go to next buffer", silent = true })
vim.keymap.set("n", "<S-tab>", ':bp<CR>', { desc = "Go to previous buffer", silent = true })
vim.keymap.set("n", "<leader>bn", ':enew<CR>', { desc = "Open new buffer", silent = true })
-- splits
vim.keymap.set("n", "<M-,>", "<c-w>5<")
vim.keymap.set("n", "<M-.>", "<c-w>5>")
vim.keymap.set("n", "<M-t>", "<C-W>+")
vim.keymap.set("n", "<M-s>", "<C-W>-")

vim.keymap.set("n", "<leader>fm", function()
    require("conform").format { lsp_fallback = true }
end, { desc = "format files" })

vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv", { desc = "Swap with line below", silent = true })
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv", { desc = "Swap with line above", silent = true })

vim.keymap.set("n", "J", "mzJ`z")
vim.keymap.set("n", "<C-d>", "<C-d>zz", { desc = "Jump down half a page centered", silent = true })
vim.keymap.set("n", "<C-u>", "<C-u>zz", { desc = "Jump up half a page centered", silent = true })
vim.keymap.set("n", "n", "nzzzv", { desc = "Next occurence centered", silent = true })
vim.keymap.set("n", "N", "Nzzzv", { desc = "Previous occurence centered", silent = true })

--vim.keymap.set("n", "<leader>vwm", function()
--    require("vim-with-me").StartVimWithMe()
--end)
--vim.keymap.set("n", "<leader>svwm", function()
--    require("vim-with-me").StopVimWithMe()
--end)

-- greatest remap ever
vim.keymap.set("x", "<leader>p", [["_dP]])

-- next greatest remap ever : asbjornHaland
vim.keymap.set({ "n", "v" }, "<leader>y", [["+y]])
vim.keymap.set("n", "<leader>Y", [["+Y]])

vim.keymap.set({ "n", "v" }, "<leader>d", [["_d]])

-- This is going to get me cancelled
-- vim.keymap.set("i", "<C-c>", "<Esc>")

vim.keymap.set("n", "Q", "<nop>")
-- vim.keymap.set("n", "<C-f>", "<cmd>silent !tmux neww tmux-sessionizer<CR>")
-- vim.keymap.set("n", "<leader>f", vim.lsp.buf.format)

vim.keymap.set("n", "<leader>j", "<cmd>cnext<CR>zz")
vim.keymap.set("n", "<leader>k", "<cmd>cprev<CR>zz")
-- vim.keymap.set("n", "<leader>k", "<cmd>lnext<CR>zz")
-- vim.keymap.set("n", "<leader>j", "<cmd>lprev<CR>zz")

vim.keymap.set("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]])
-- vim.keymap.set("n", "<leader>x", "<cmd>!chmod +x %<CR>", { silent = true })

-- vim.keymap.set(
--     "n",
--     "<leader>ee",
--     "oif err != nil {<CR>}<Esc>Oreturn err<Esc>"
-- )

-- vim.keymap.set("n", "<leader>mr", "<cmd>CellularAutomaton make_it_rain<CR>");

-- vim.keymap.set("n", "<leader><leader>", function()
--     vim.cmd("so")
-- end)


-- Comment
vim.keymap.set("n", "<leader>/", function()
    require("Comment.api").toggle.linewise.current()
end, { desc = "comment toggle" })

vim.keymap.set(
    "v",
    "<leader>/",
    "<ESC><cmd>lua require('Comment.api').toggle.linewise(vim.fn.visualmode())<CR>",
    { desc = "comment toggle" }
)


-- whichkey
vim.keymap.set("n", "<leader>wK", "<cmd>WhichKey <CR>", { desc = "whichkey all keymaps" })

vim.keymap.set("n", "<leader>wk", function()
    vim.cmd("WhichKey " .. vim.fn.input "WhichKey: ")
end, { desc = "whichkey query lookup" })

vim.keymap.set('n', '<leader>cr', function()
  vim.cmd('CopyRelativeFilePath')
end, { noremap = true, silent = true, desc = "Copy Relative File path" })
vim.keymap.set('n', '<leader>r', function()
  vim.cmd('Runts app.ts')
end, { noremap = true, silent = true, desc = "Run app.ts using RunScript command" })
