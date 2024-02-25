local opt = vim.opt

opt.guicursor = ""
opt.relativenumber = true


opt.hlsearch = false
opt.incsearch = true
opt.scrolloff = 8


opt.swapfile = false
opt.backup = false
opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
opt.undofile = true
