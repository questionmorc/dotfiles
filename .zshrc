## see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
## for examples
#
## If not running interactively, don't do anything
#case $- in
#    *i*) ;;
#      *) return;;
#esac
#
## don't put duplicate lines or lines starting with space in the history.
## See bash(1) for more options
HISTCONTROL=ignoreboth
#
## append to the history file, don't overwrite it
##shopt -s histappend
#
## for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# enable color support of ls and also add handy aliases
export CLICOLOR=1

# colored GCC warnings and errors
#export GCC_COLORS='error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01'

alias grep='grep --color=auto'
# some more ls aliases
alias ls="ls -G"
alias ll='ls -aGlF'
alias la='ls -A'
alias l='ls -CF'

alias vim='nvim'
alias vi='nvim'

eval "$(oh-my-posh init zsh --config '~/oh-my-posh-themes/mrrc.json')"
alias config="/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME"

# The next line updates PATH for the Google Cloud SDK.
if [ -f "$HOME/lib/google-cloud-sdk/path.zsh.inc" ]; then . "$HOME/lib/google-cloud-sdk/path.zsh.inc"; fi

# The next line enables shell command completion for gcloud.
if [ -f "$HOME/lib/google-cloud-sdk/completion.zsh.inc" ]; then . "$HOME/lib/google-cloud-sdk/completion.zsh.inc"; fi

path+=($HOME/bin)
#export PATH=$PATH:$HOME/bin
eval "$(mise activate zsh)"
GOROOT="$HOME/.local/share/mise/installs/go/1.22.0"
export LIBRARY_PATH=/opt/homebrew/lib
