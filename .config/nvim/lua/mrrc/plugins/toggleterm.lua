return {
  "akinsho/toggleterm.nvim",
  version = "*",
  opts = {
    vim.keymap.set("n", "<leader>tt", "<cmd>lua require('toggleterm').toggle()<CR>", { desc = "Toggle terminal", noremap = true, silent = true })
  }
}
