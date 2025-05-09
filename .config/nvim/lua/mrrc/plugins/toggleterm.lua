return {
  "akinsho/toggleterm.nvim",
  version = "*",
  opts = function()
    local terminal = require("toggleterm")
    -- vim.keymap.set("n", "<leader>tt", "<cmd>lua require('toggleterm').toggle()<CR>",
    --   { desc = "Toggle terminal", noremap = true, silent = true })
    -- Ensure the toggleterm library is loaded

    -- Define a keymap using the term library
    vim.keymap.set("n", "<leader>tt", function()
      terminal.toggle()
    end, { desc = "Toggle Terminal" })

    vim.keymap.set("n", "<leader>tx", function()
      terminal.exec("echo 'hello world'", nil, nil, nil, nil, nil, false, true)
      -- terminal.sen
    end, { desc = "toggle terminal" })

    -- local terminal = require("toggleterm")
    -- vim.keymap.set("n", "<leader>te",
    --   vim.cmd(terminal.exec_command("echo 'hello world'")),
    --   { desc = "Toggle terminal", noremap = true, silent = true })
  end
}
