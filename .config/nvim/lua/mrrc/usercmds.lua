vim.api.nvim_create_user_command('CopyRelativeFilePath', function()
  local filepath = vim.fn.expand('%') -- Get the relative file path of the current buffer
  if filepath == '' then
    print('No file path to copy (buffer is empty or unsaved).')
    return
  end
  vim.fn.setreg('+', filepath) -- Copy the file path to the system clipboard
  print('Relative file path copied to clipboard: ' .. filepath)
end, {})
