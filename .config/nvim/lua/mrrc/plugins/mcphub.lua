return {
  "ravitemer/mcphub.nvim",
  enabled = true,
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  -- build = "npm install -g mcp-hub@latest", -- Installs `mcp-hub` node binary globally
  build = "bundled_build.lua",     -- Bundles `mcp-hub` binary along with the neovim plugin
  config = function()
    require("mcphub").setup({
      use_bundled_binary = true
    })
  end
}
