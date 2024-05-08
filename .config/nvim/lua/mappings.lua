require "nvchad.mappings"
local map = vim.keymap.set




-- Telescope
map({ "n" }, "<leader>fg", "<cmd>  Telescope git_files <CR>", { desc = "Telescope Find from git ls-files" })
map({ "n" }, "<leader>fw", ":lua require('telescope').extensions.live_grep_args.live_grep_args()<CR>",
  {
    desc = "Telescope grep with args",
    silent = true
  })
map({ "n" }, "<leader>fp", ":lua require'telescope'.extensions.project.project{}<CR>", {
  desc = "Telescope Projects",
  silent = true
})
map({ "n" }, "<leader>fj", ":Telescope file_browser<CR>", { desc = "Telescope File Browser", silent = true })
map({ "n" }, "<leader>td", ":Telescope terraform_doc<CR>", { desc = "Terraform docs", silent = true })
map({ "n" }, "<leader>tg", ":Telescope terraform_doc full_name=hashicorp/google<CR>", {
  desc = "Terraform GCP docs",
  silent = true
})

-- QuickFix
map({ "n" }, "<leader>k", "<cmd>cprev<CR>zz", { desc = "Quickfix Previous item" })
map({ "n" }, "<leader>j", "<cmd>cnext<CR>zz", { desc = "Quiclfix Next item" })


-- Fugitive
map({ "n" }, "<leader>gs", vim.cmd.Git, { desc = "Fugitive git status", silent = true })
-- map({ "n" }, "<leader>gs", vim.cmd.Git)
--
-- General
map({ "n" }, "<C-d>", "<C-d>zz")
map({ "n" }, "<C-u>", "<C-u>zz")
map({ "n" }, "n", "nzzzv")
map({ "n" }, "N", "Nzzzv")
map({ "n" }, "<C-h>", "<cmd> TmuxNavigateLeft<CR>", { desc = "TmuxNavigator window left" })
map({ "n" }, "<C-l>", "<cmd> TmuxNavigateRight<CR>", { desc = "TmuxNavigator window right" })
map({ "n" }, "<C-j>", "<cmd> TmuxNavigateDown<CR>", { desc = "TmuxNavigator window down" })
map({ "n" }, "<C-k>", "<cmd> TmuxNavigateUp<CR>", { desc = "TmuxNavigator window up" })


-- Harpoon
map({ "n" }, "<leader>mt", "<cmd>lua require('harpoon').ui:toggle_quick_menu(require('harpoon'):list())<cr>",
  { desc = "Harpoon quick menu", silent = true })
map({ "n" }, "<leader>mm", "<cmd>lua require('harpoon'):list():add()<cr>", { desc = "Harpoon Mark file" })
map({ "n" }, "<leader>ma", "<cmd>lua require('harpoon'):list():select(1)<cr>", { desc = "Harpoon Goto mark 1" })
map({ "n" }, "<leader>ms", "<cmd>lua require('harpoon'):list():select(2)<cr>", { desc = "Harpoon Goto mark 2" })
map({ "n" }, "<leader>md", "<cmd>lua require('harpoon'):list():select(3)<cr>", { desc = "Harpoon Goto mark 3" })
map({ "n" }, "<leader>mf", "<cmd>lua require('harpoon'):list():select(4)<cr>", { desc = "Harpoon Goto mark 4" })
map({ "n" }, "<leader>mg", "<cmd>lua require('harpoon'):list():select(5)<cr>", { desc = "Harpoon Goto mark 5" })
map({ "n" }, "<leader>mq", "<cmd>lua require('harpoon'):list():select(6)<cr>", { desc = "Harpoon Goto mark 6" })
map({ "n" }, "<leader>mw", "<cmd>lua require('harpoon'):list():select(7)<cr>", { desc = "Harpoon Goto mark 7" })
map({ "n" }, "<leader>me", "<cmd>lua require('harpoon'):list():select(8)<cr>", { desc = "Harpoon Goto mark 8" })
map({ "n" }, "<leader>mr", "<cmd>lua require('harpoon'):list():select(9)<cr>", { desc = "Harpoon Goto mark 9" })
map({ "n" }, "<leader>mn", "<cmd>lua require('harpoon'):list():next()<cr>", { desc = "Harpoon Next file" })
map({ "n" }, "<leader>mN", "<cmd>lua require('harpoon'):list():prev()<cr>", { desc = "Harpoon Prev file" })


-- M.undotree = {
--   n = {
--     ["<leader>u"] = { vim.cmd.UndotreeToggle },
--   }
-- }
--
local diagnostics_active = true
local toggle_diagnostics = function()
  diagnostics_active = not diagnostics_active
  if diagnostics_active then
    vim.diagnostic.show()
  else
    vim.diagnostic.hide()
  end
end

vim.keymap.set('n', '<leader>tt', toggle_diagnostics)
