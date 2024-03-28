local M = {}

M.dap = {
  plugin = true,
  n = {
    ["<leader>db"] = {
      "<cmd> DapToggleBreakpoint <CR>",
      "Add breakpoint at line"
    },
    ["<leader>dus"] = {
      function()
        local widgets = require('dap.ui.widgets');
        local sidebar = widgets.sidebar(widgets.scopes);
        sidebar.open();
      end,
      "Open debugging sidebar"
    }
  }
}

M.dap_go = {
  plugin = true,
  n = {
    ["<leader>dgt"] = {
      function()
        require('dap-go').debug_test()
      end,
      "Debug go test"
    },
    ["<leader>dgl"] = {
      function()
        require('dap-go').debug_last()
      end,
      "Debug last go test"
    }
  }
}

M.gopher = {
  plugin = true,
  n = {
    ["<leader>gsj"] = {
      "<cmd> GoTagAdd json <CR>",
      "Add json struct tags"
    },
    ["<leader>gsy"] = {
      "<cmd> GoTagAdd yaml <CR>",
      "Add yaml struct tags"
    }
  }
}
M.telescope = {
  n = {
    ["<leader>fg"] = {"<cmd>  Telescope git_files <CR>", "Find only files from git ls-files"},
    ["<leader>fw"] = { ":lua require('telescope').extensions.live_grep_args.live_grep_args()<CR>", "Grep with args", opts = { silent = true } },
    ["<leader>fp"] = { ":lua require'telescope'.extensions.project.project{}<CR>", "Open Telescope Projects", opts = { silent = true } },
    ["<leader>fb"] = { ":Telescope file_browser<CR>", "Open Telescope File Browser", opts = { silent = true } },
    ["<leader>td"] = { ":Telescope terraform_doc<CR>", "Open Terraform docs", opts = { silent = true } },
    ["<leader>tg"] = { ":Telescope terraform_doc full_name=hashicorp/google<CR>", "Open Terraform docs", opts = { silent = true } },


  }
}
M.fugitive = {
  n = {
    ["<leader>gs"] = { vim.cmd.Git },
  }
}
-- local diagnostics_active = true
-- local toggle_diagnostics = function()
--     diagnostics_active = not diagnostics_active
--     if diagnostics_active then
--         vim.diagnostic.show()
--   else
--     vim.diagnostic.hide()
--   end
-- end
--
-- M.lsp = {
--   n = {
--     ["<leader>tt"] = {toggle_diagnostics(), "Toggle LSP diagnostics"},
--   }
-- }

M.undotree = {
  n = {
    ["<leader>u"] = { vim.cmd.UndotreeToggle },
  }
}
M.general = {
  n = {
    ["<C-d>"] = { "<C-d>zz" },
    ["<C-u>"] = { "<C-u>zz" },
    ["n"] = { "nzzzv" },
    ["N"] = { "Nzzzv" },
    ["<C-h>"] = { "<cmd> TmuxNavigateLeft<CR>", "window left" },
    ["<C-l>"] = { "<cmd> TmuxNavigateRight<CR>", "window right" },
    ["<C-j>"] = { "<cmd> TmuxNavigateDown<CR>", "window down" },
    ["<C-k>"] = { "<cmd> TmuxNavigateUp<CR>", "window up" },
  }
}
return M
