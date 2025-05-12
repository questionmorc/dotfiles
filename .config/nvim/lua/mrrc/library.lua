local M = {}
local terminal = require('toggleterm')
local pickers = require('telescope.pickers')
local finders = require('telescope.finders')
local actions = require('telescope.actions')
local action_state = require('telescope.actions.state')

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
  M.write_cache(command_str)
  terminal.exec(command_str, nil, nil, nil, nil, nil, false, true)
end


-- Function to enter command mode with a pre-filled string and custom completion options
M.command_with_completion = function(prefill, options)
  -- Validate input
  if not prefill or prefill == "" then
    print("Error: No prefill string provided.")
    return
  end
  if not options or type(options) ~= "table" then
    print("Error: Options must be a table.")
    return
  end

  -- Enter command mode with the prefill string
  vim.api.nvim_feedkeys(":" .. prefill .. " ", "n", false)

  -- Set up completion menu
  vim.defer_fn(function()
    vim.fn.complete(vim.fn.col('.'), options)
  end, 10) -- Slight delay to ensure completion works
end

--@param stack string
M.run_spacelift_stack = function(stack)
  M.run_command_toggleterm("spacectl", { "stack", "local-preview", "--id", stack }, { use_buffer_dir = true })
end

M.run_cached = function()
  local command = M.read_cache()
  if not command then
    print("No cached command found. Exiting.")
    return
  end
  -- M.run_command_toggleterm(command)
  -- Split the cached command into the base command and arguments
  local args = {}
  for word in command:gmatch("%S+") do
    table.insert(args, word)
  end

  -- The first word is the base command, the rest are arguments
  local base_command = table.remove(args, 1)

  -- Call run_command_toggleterm with the parsed command and arguments
  M.run_command_toggleterm(base_command, args, {})
end

M.select_and_execute = function(command, options)
  pickers.new({}, {
    prompt_title = "Select a String",
    finder = finders.new_table(options),
    sorter = require('telescope.config').values.generic_sorter({}),
    attach_mappings = function(_)
      actions.select_default:replace(function()
        actions.close(_)
        local selection = action_state.get_selected_entry()
        if selection then
          print("You selected: " .. selection[1])
          command(selection[1])
          -- vim.cmd('echo "Hello, Neovim!"')
        else
          print("No selection made.")
        end
      end)
      return true
    end,
  }):find()
end

M.write_cache = function(content)
  -- Validate input
  if not content or type(content) ~= "string" then
    print("Error: Content must be a string.")
    return
  end

  -- Define the cache file path
  local cache_file_path = vim.fn.stdpath("config") .. "/cache.txt"

  -- Open the file in write mode, creating it if it doesn't exist
  local file, err = io.open(cache_file_path, "w")
  if not file then
    print("Error opening file: " .. err)
    return
  end

  -- Write the content to the file
  file:write(content)
  file:close()

  print("Content written to cache file: " .. cache_file_path)
end

M.read_cache = function()
  -- Define the cache file path
  local cache_file_path = vim.fn.stdpath("config") .. "/cache.txt"

  -- Check if the file exists
  local file = io.open(cache_file_path, "r")
  if not file then
    print("Cache is empty")
    return nil
  end

  -- Read the content of the file
  local content = file:read("*a")
  file:close()

  -- Return the content
  return content
end

return M
