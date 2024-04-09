return {
  "folke/noice.nvim",
  event = "VeryLazy",

  opts = {
    routes = {
      {
        view = "notify",
        filter = { event = "msg_showmode" },
      },
    },
    lsp = {
      hover = {
        enabled = false
      },
      signature = {
        enabled = false
      },
    },
  },
  dependencies = {
    "MunifTanjim/nui.nvim",
    "rcarriga/nvim-notify",
  }
}
