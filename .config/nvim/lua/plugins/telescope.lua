return {
  "nvim-telescope/telescope.nvim",
  dependencies = {
    "nvim-telescope/telescope-live-grep-args.nvim",
    "nvim-telescope/telescope-project.nvim",
    "nvim-telescope/telescope-file-browser.nvim",
    "ANGkeith/telescope-terraform-doc.nvim",
    version = "^1.0.0",
  },
  opts = function()
    require "configs.telescope"
  end,
}
