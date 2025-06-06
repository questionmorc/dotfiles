local terminal = require('toggleterm')

vim.api.nvim_create_user_command('CopyRelativeFilePath', function()
  local filepath = vim.fn.expand('%') -- Get the relative file path of the current buffer
  if filepath == '' then
    print('No file path to copy (buffer is empty or unsaved).')
    return
  end
  vim.fn.setreg('+', filepath) -- Copy the file path to the system clipboard
  vim.fn.setreg('"', filepath) -- Copy the file path to the "yank" register
  print('Relative file path copied to clipboard: ' .. filepath)
end, {})

vim.api.nvim_create_user_command('Runts', function(opts)

  local use_buffer_dir = false
  local script_path

  -- Check if the first argument is the --buffer-dir flag
  if opts.fargs[1] == "-b" then
    use_buffer_dir = true
    script_path = opts.fargs[2] -- The script path is the second argument
  else
    script_path = opts.fargs[1] -- The script path is the first argument
  end

  if not script_path then
    print("Error: No script path provided.")
    return
  end

  -- Determine the base directory
  local base_dir
  if use_buffer_dir then
    base_dir = vim.fn.expand('%:p:h') -- Get the directory of the current buffer
  else
    base_dir = vim.fn.getcwd()        -- Get the current working directory
  end

  -- Construct the full script path
  local full_script_path = base_dir .. "/" .. script_path
  local command = "npx tsx " .. full_script_path
  terminal.exec(command, nil, nil, nil, nil, nil, false, true)

end, {
  nargs = "+", -- Require at least one argument
  desc = "Run the specified script in a terminal, optionally using the buffer's directory",
  complete = function(arglead, cmdline)
    local args = vim.split(cmdline, "%s+")
    if #args == 2 then
      local file_completions = vim.fn.getcompletion(arglead, "file")
      -- Add `-b` as an additional option
      table.insert(file_completions, 1, "-b")
      return file_completions
    else
      --j Otherwise, provide file path completion
      return vim.fn.getcompletion(arglead, "file")
    end
  end,
})

-- local lib = require("mrrc.library")
--
-- vim.keymap.set('n', '<leader>rt', function()
--   lib.run_command_toggleterm("ls", { args = { "-l" }, use_buffer_dir = true })
-- end, { noremap = true, silent = true, desc = "Run app.ts using RunScript command" })
