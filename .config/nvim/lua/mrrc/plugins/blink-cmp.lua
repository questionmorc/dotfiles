return {
  {
    'saghen/blink.cmp',
    -- dependencies = 'rafamadriz/friendly-snippets',
    dependencies = {
      'L3MON4D3/LuaSnip', version = 'v2.*'
    },

    version = 'v0.*',

    opts = {
      keymap = {
        preset = 'default',
        ['<C-h>'] = { 'show', 'show_documentation', 'hide_documentation' },
      },
      snippets = { preset = 'luasnip' },

      appearance = {
        -- use_nvim_cmp_as_default = true,
        nerd_font_variant = 'mono'
      },
      sources = {
        default = { "lsp", "path", "snippets", "buffer" },
        per_filetype = {
          lua = { inherit_defaults = true, "lazydev" }
        },
        providers = {
          lazydev = {
            name = "LazyDev",
            module = "lazydev.integrations.blink",
            -- make lazydev completions top priority (see `:h blink.cmp`)
            score_offset = 100,
          },
        },
      },

      signature = { enabled = true },
      fuzzy = { implementation = "prefer_rust_with_warning" },
      cmdline = {
        completion = { menu = { auto_show = true } },
      },
    },
  },
}
