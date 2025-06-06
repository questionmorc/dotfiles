return {
  "nvim-telescope/telescope.nvim",

  tag = "0.1.8",

  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope-live-grep-args.nvim",
    "ANGkeith/telescope-terraform-doc.nvim",
    { "nvim-telescope/telescope-fzf-native.nvim", build = "make" },
    version = "^1.0.0",
  },

  config = function()
    local lga_actions = require('telescope-live-grep-args.actions')
    -- local open_with_trouble = require("trouble.sources.telescope").open

    require('telescope').setup({
      defaults = {
        vimgrep_arguments = {
          "rg",
          "-L",
          "--color=never",
          "--no-heading",
          "--with-filename",
          "--line-number",
          "--column",
          "--smart-case",
        },
        sorting_strategy = "ascending",
        layout_strategy = "horizontal",
        layout_config = {
          horizontal = {
            prompt_position = "top",
            preview_width = 0.55,
            results_width = 0.8,
          },
          vertical = {
            mirror = false,
          },
          width = 0.87,
          height = 0.80,
          preview_cutoff = 120,
        },
        ignore_patterns = {
          "node_modules",
          ".git",
          ".cache",
          -- ".terraform",
          ".serverless",
          ".vscode",
          ".github",
          ".idea",
          ".next",
          ".nuxt",
          ".cache",
          ".history",
          ".logs",
          ".stack-work",
          ".bloop",
          ".metals",
          ".ccls-cache",
          ".clangd",
          ".cquery",
          ".eunit",
          ".gitlab",
          ".hg",
          ".svn",
          ".tox",
          ".venv",
          ".virtualenv",
          ".vscode-test",
          ".yarn",
          ".yarnrc",
          ".yarn-integrity",
          ".yarn-metadata",
          ".yarnignore",
          ".yarn-integrity",
          ".yarnrc",
          ".yarnrc.yml",
          ".yarnrc.yaml",
          ".yarnrc.json",
          ".yarnrc.lock",
          ".yarnpkg",
          ".yarnpkg.yml",
          ".yarnpkg.yaml",
          ".yarnpkg.json",
          ".yarnpkg.lock",
          ".yarnpkg.cache",
          ".yarnpkg-integrity",
          ".yarnpkg-metadata",
          ".yarnpkgignore",
          ".yarnpkg-integrity",
          ".yarnpkgrc",
          ".yarnpkgrc.yml",
          ".yarnpkgrc.yaml",
          ".yarnpkgrc.json",
          ".yarnpkgrc.lock",
          ".yarnpkgrc.cache",
          ".yarnpkgrc-integrity",
          ".yarnpkgrc-metadata",
          ".yarnpkgrcignore",
          ".yarnpkgrc-integrity",
          ".yarnrc.cjs",
          ".yarnrc.mjs",
          ".yarnrc.js",
          ".yarnrc.ts",
          ".yarnrc.tsx",
          ".yarnrc.jsx",
          ".yarnrc.vue",
          ".yarnrc.svelte",
          ".yarnrc.html",
          ".yarnrc.htm",
          ".yarnrc.css",
          ".yarnrc.scss",
          ".yarnrc.sass",
          ".yarnrc.less",
          ".yarnrc.styl",
          ".yarnrc.stylus",
          ".yarnrc.md",
          ".yarnrc.markdown",
          ".yarnrc.rst",
          ".yarnrc.html",
        },

        -- mappings = {
        --   i = { ["<c-t>"] = open_with_trouble },
        --   n = { ["<c-t>"] = open_with_trouble },
        -- }
      },

      extensions = {
        projects = {},
        file_browser = {},
        fzf = {},
        terraform_doc = {},
        live_grep_args = {
          auto_quoting = true,
          mappings = {
            i = {
              ["<C-k>"] = lga_actions.quote_prompt(),
              ["<C-i>"] = lga_actions.quote_prompt({ postfix = " --iglob " }),
              ["<C-a>"] = lga_actions.quote_prompt({ postfix = " --hidden " }),
            }
          }
        }
      }
    })
    local extensions_list = {
      -- "project",
      -- "file_browser",
      "fzf",
      "terraform_doc",
      "live_grep_args",
      "git_worktree"
    }
    local telescope = require('telescope')
    for _, ext in ipairs(extensions_list) do
      telescope.load_extension(ext)
    end

    local builtin = require('telescope.builtin')
    vim.keymap.set('n', '<leader>ff', builtin.find_files, { desc = "telescope find files" })
    vim.keymap.set('n', '<leader>fd', function()
      builtin.find_files {
        cwd = vim.fn.stdpath('config')
      }
    end, { desc = "telescope find nvim config files" })

    -- vim.keymap.set('n', '<leader>fn', function()
    --   builtin.find_files {
    --     cwd = "$HOME/code/nix-cfg"
    --     -- cwd = vim.fn.stdpath('config')
    --   }
    -- end, { desc = "telescope find nixos config files" })
    vim.keymap.set('n', '<leader>fg', builtin.git_files, { desc = "telescope git files" })
    vim.keymap.set('n', '<leader>pws', function()
      local word = vim.fn.expand("<cword>")
      builtin.grep_string({ search = word })
    end)
    vim.keymap.set('n', '<leader>pWs', function()
      local word = vim.fn.expand("<cWORD>")
      builtin.grep_string({ search = word })
    end)
    -- vim.keymap.set('n', '<leader>fw', function()
    -- builtin.grep_string({ search = vim.fn.input("Grep > ") })
    -- end)
    vim.keymap.set('n', '<leader>fh', builtin.help_tags, { desc = "Telescope Help page" })
    -- telescope
    -- vim.keymap.set("n", "<leader>fw", "<cmd>Telescope live_grep<CR>", { desc = "telescope live grep" })
    vim.keymap.set("n", "<leader>fb", builtin.buffers, { desc = "telescope find buffers" })
    vim.keymap.set("n", "<leader>ma", builtin.marks, { desc = "telescope find marks" })
    vim.keymap.set("n", "<leader>fo", builtin.oldfiles, { desc = "telescope find oldfiles" })
    vim.keymap.set("n", "<leader>fz", builtin.current_buffer_fuzzy_find,
      { desc = "telescope find in current buffer" })
    vim.keymap.set("n", "<leader>cm", builtin.git_commits, { desc = "telescope git commits" })
    vim.keymap.set("n", "<leader>gt", builtin.git_status, { desc = "telescope git status" })
    vim.keymap.set(
      "n",
      "<leader>fa",
      "<cmd>Telescope find_files follow=true no_ignore=true hidden=true<CR>",
      { desc = "telescope find all files" }
    )
    vim.keymap.set({ "n" }, "<leader>fw", ":lua require('telescope').extensions.live_grep_args.live_grep_args()<CR>",
      {
        desc = "Telescope grep with args",
        silent = true
      })

    vim.keymap.set({ "n" }, "<leader>fn", function()
      local current_dir = vim.fn.expand('%:p:h') -- Get the directory of the current buffer
      telescope.extensions.live_grep_args.live_grep_args({
        search_dirs = { current_dir }            -- Set the search directory
      })
    end, {
      desc = "Telescope grep in current buffer's directory",
      silent = true
    })

    vim.keymap.set('n', '<leader>fr', function()
      builtin.find_files {
        cwd = vim.fn.expand('%:p:h')
      }
    end, { desc = "telescope find files relative to current dir" })
    -- vim.keymap.set({ "n" }, "<leader>fp", ":lua require'telescope'.extensions.project.project{}<CR>", {
    --   desc = "Telescope Projects",
    --   silent = true
    -- })
    -- vim.keymap.set({ "n" }, "<leader>fj", ":Telescope file_browser<CR>",
    --   { desc = "Telescope File Browser", silent = true })
    vim.keymap.set({ "n" }, "<leader>td", ":Telescope terraform_doc<CR>", { desc = "Terraform docs", silent = true })

    vim.keymap.set({ "n" }, "<leader>ta", ":Telescope terraform_doc full_name=hashicorp/aws<CR>", {
      desc = "Terraform AWS docs",
      silent = true
    })
    vim.keymap.set({ "n" }, "<leader>tg", ":Telescope terraform_doc full_name=hashicorp/google<CR>", {
      desc = "Terraform GCP docs",
      silent = true
    })

    vim.keymap.set("n", "<leader>ws", ":lua require('telescope').extensions.git_worktree.git_worktrees()<CR>",
      { desc = "Switch/Delete git worktrees", silent = true })
    vim.keymap.set("n", "<leader>wc", ":lua require('telescope').extensions.git_worktree.create_git_worktree()<CR>",
      { desc = "Create git worktrees", silent = true })
  end
}
