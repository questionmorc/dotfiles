local llm = require('llm')

llm.setup({
  model = "codellama:latest",
  url = "http://localhost:11434/api/generate",
  -- cf https://github.com/ollama/ollama/blob/main/docs/api.md#parameters
  backend = "ollama",
  request_body = {
    -- Modelfile options for the model you use
    options = {
      temperature = 0.2,
      top_p = 0.95,
    },
    lsp = {
      bin_path = vim.api.nvim_call_function("stdpath", { "data" }) .. "/mason/bin/llm-ls",
    }
  }
}
)
