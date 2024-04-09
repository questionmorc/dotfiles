require "nvchad.mappings"
local map = vim.keymap.set




-- Telescope
map({ "n" }, "<leader>fg", "<cmd>  Telescope git_files <CR>", { desc = "Find only files from git ls-files" })
map({ "n" }, "<leader>fw", ":lua require('telescope').extensions.live_grep_args.live_grep_args()<CR>",
  {
    desc = "Grep with args",
    silent = true
  })
map({ "n" }, "<leader>fp", ":lua require'telescope'.extensions.project.project{}<CR>", {
  desc = "Open Telescope Projects",
  silent = true
})
map({ "n" }, "<leader>fb", ":Telescope file_browser<CR>", { desc = "Open Telescope File Browser", silent = true })
map({ "n" }, "<leader>td", ":Telescope terraform_doc<CR>", { desc = "Open Terraform docs", silent = true })
map({ "n" }, "<leader>tg", ":Telescope terraform_doc full_name=hashicorp/google<CR>", {
  desc = "Open Terraform docs",
  silent = true
})

map({ "n" }, "<leader>gs", vim.cmd.Git, { desc = "Open Terraform docs", silent = true })

-- Fugitive
map({ "n" }, "<leader>gs", vim.cmd.Git)
--
-- General
map({ "n" }, "<C-d>", "<C-d>zz")
map({ "n" }, "<C-u>", "<C-u>zz")
map({ "n" }, "n", "nzzzv")
map({ "n" }, "N", "Nzzzv")
map({ "n" }, "<C-h>", "<cmd> TmuxNavigateLeft<CR>", { desc = "window left" })
map({ "n" }, "<C-l>", "<cmd> TmuxNavigateRight<CR>", { desc = "window right" })
map({ "n" }, "<C-j>", "<cmd> TmuxNavigateDown<CR>", { desc = "window down" })
map({ "n" }, "<C-k>", "<cmd> TmuxNavigateUp<CR>", { desc = "window up" })


-- Harpoon
--     -- ["<leader>mt"] = { "<cmd>lua require('harpoon').ui:toggle_quick_menu(require('harpoon'):list())<cr>", "Toggle UI" },
map({ "n" }, "<leader>mm", "<cmd>lua require('harpoon'):list():add()<cr>", { desc = "Mark file" })
map({ "n" }, "<leader>ma", "<cmd>lua require('harpoon'):list():select(1)<cr>", { desc = "Goto mark 1" })
map({ "n" }, "<leader>ms", "<cmd>lua require('harpoon'):list():select(2)<cr>", { desc = "Goto mark 2" })
map({ "n" }, "<leader>md", "<cmd>lua require('harpoon'):list():select(3)<cr>", { desc = "Goto mark 3" })
map({ "n" }, "<leader>mf", "<cmd>lua require('harpoon'):list():select(4)<cr>", { desc = "Goto mark 4" })
map({ "n" }, "<leader>mg", "<cmd>lua require('harpoon'):list():select(5)<cr>", { desc = "Goto mark 5" })
map({ "n" }, "<leader>mq", "<cmd>lua require('harpoon'):list():select(6)<cr>", { desc = "Goto mark 6" })
map({ "n" }, "<leader>mw", "<cmd>lua require('harpoon'):list():select(7)<cr>", { desc = "Goto mark 7" })
map({ "n" }, "<leader>me", "<cmd>lua require('harpoon'):list():select(8)<cr>", { desc = "Goto mark 8" })
map({ "n" }, "<leader>mr", "<cmd>lua require('harpoon'):list():select(9)<cr>", { desc = "Goto mark 9" })
map({ "n" }, "<leader>mn", "<cmd>lua require('harpoon'):list():next()<cr>", { desc = "Next file" })
map({ "n" }, "<leader>mN", "<cmd>lua require('harpoon'):list():prev()<cr>", { desc = "Prev file" })


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
