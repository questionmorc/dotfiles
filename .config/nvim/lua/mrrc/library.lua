local M = {}
local terminal = require('toggleterm')

M.run_command_toggleterm = function(command, args, options)
  -- Validate the command
  if not command or command == "" then
    print("Error: No command provided.")
    return
  end

  -- Default args and options
  args = args or {}
  options = options or {}

  -- Determine the base directory
  local base_dir
  if options.use_buffer_dir then
    base_dir = vim.fn.expand('%:p:h') -- Get the directory of the current buffer
  else
    base_dir = vim.fn.getcwd()        -- Get the current working directory
  end

  -- Construct the full script path if provided
  local full_script_path = options.script_path and (base_dir .. "/" .. options.script_path) or nil

  -- Construct the command string
  local command_str = command
  if full_script_path then
    command_str = command_str .. " " .. full_script_path
  end
  if #args > 0 then
    command_str = command_str .. " " .. table.concat(args, " ")
  end

  -- Execute the command
  terminal.exec(command_str, nil, nil, nil, nil, nil, false, true)
end

return M
