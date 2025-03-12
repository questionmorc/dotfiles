# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=$HISTSIZE
HISTDUP=erase
setopt appendhistory
setopt sharehistory
setopt hist_ignore_space
setopt hist_ignore_all_dups
setopt hist_save_no_dups
setopt hist_ignore_dups
setopt hist_find_no_dups
# setopt SHARE_HISTORY

# enable color support of ls and also add handy aliases
export CLICOLOR=1
#
# Setting for the new UTF-8 terminal support
LC_CTYPE=en_US.UTF-8
LC_ALL=en_US.UTF-8

# colored GCC warnings and errors
#export GCC_COLORS='error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01'

alias grep='grep --color=auto'
# some more ls aliases
alias ls="ls --color -G"
alias ll='ls -aGlF'
alias la='ls -A'
alias l='ls -CF'

alias vim='nvim'
alias vi='nvim'

# alias config="/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME"

# The next line updates PATH for the Google Cloud SDK.
if [ -f "$HOME/lib/google-cloud-sdk/path.zsh.inc" ]; then . "$HOME/lib/google-cloud-sdk/path.zsh.inc"; fi

# The next line enables shell command completion for gcloud.
if [ -f "$HOME/lib/google-cloud-sdk/completion.zsh.inc" ]; then . "$HOME/lib/google-cloud-sdk/completion.zsh.inc"; fi

path+=($HOME/bin)
path+=($HOME/.bin)
path+=($HOME/.local/bin)
#export PATH=$PATH:$HOME/bin
#/
# What OS are we running?
if [[ $(uname) == "Darwin" ]]; then
    #source "$ZSH_CUSTOM"/os/mac.zsh
  path+=($HOME/code/backend/platform/bin)
  path+=(/opt/homebrew/Cellar/mysql-client/8.3.0/bin)
  export PATH=/opt/homebrew/opt/gnu-tar/libexec/gnubin:$PATH
  eval "$(mise activate -C ~/code/backend zsh)"
  GOROOT="$HOME/.local/share/mise/installs/go/1.22.1"
  export LIBRARY_PATH=/opt/homebrew/lib
  autoload -U +X bashcompinit && bashcompinit
  complete -o nospace -C /Users/malloul/.local/share/mise/installs/tanka/latest/bin/tk tk
  alias sed='gsed'
fi

if command -v apt &> /dev/null; then
  GOROOT="/usr/local/go"
  path+=(/usr/local/go/bin)
fi

path+=(/$HOME/go/bin)
export K9S_EDITOR=nvim


#autoload -U +X bashcompinit && bashcompinit
#complete -o nospace -C /opt/homebrew/bin/terragrunt terragrunt
#alias ls="exa"
#alias "ls -ltr"="ls -lsnew"
#alias ll="exa -lgah"
#alias tree="exa --tree"
export KUBE_EDITOR=nvim

eval "$(oh-my-posh init zsh --config '~/oh-my-posh-themes/mrrc.json')"
eval "$(zoxide init --cmd cd zsh)"

# Bash/ZSH example using less
export PAGER="less"
fpath=(~/.zsh.d/ $fpath)

export EDITOR=nvim
path+=($HOME/.tmux/plugins/tmuxifier/bin)
export TMUXIFIER_LAYOUT_PATH="$HOME/dotfiles/tmux-layouts"
#export TMUXIFIER_TMUX_ITERM_ATTACH="-CC"
eval "$(tmuxifier init -)"
bindkey -M vicmd '/' history-incremental-search-backward

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion


### Added by Zinit's installer
if [[ ! -f $HOME/.local/share/zinit/zinit.git/zinit.zsh ]]; then
    print -P "%F{33} %F{220}Installing %F{33}ZDHARMA-CONTINUUM%F{220} Initiative Plugin Manager (%F{33}zdharma-continuum/zinit%F{220})…%f"
    command mkdir -p "$HOME/.local/share/zinit" && command chmod g-rwX "$HOME/.local/share/zinit"
    command git clone https://github.com/zdharma-continuum/zinit "$HOME/.local/share/zinit/zinit.git" && \
        print -P "%F{33} %F{34}Installation successful.%f%b" || \
        print -P "%F{160} The clone has failed.%f%b"
fi

source "$HOME/.local/share/zinit/zinit.git/zinit.zsh"
autoload -Uz _zinit
(( ${+_comps} )) && _comps[zinit]=_zinit

# Load a few important annexes, without Turbo
# (this is currently required for annexes)
zinit light-mode for \
    zdharma-continuum/zinit-annex-as-monitor \
    zdharma-continuum/zinit-annex-bin-gem-node \
    zdharma-continuum/zinit-annex-patch-dl \
    zdharma-continuum/zinit-annex-rust

### End of Zinit's installer chunk
zinit ice depth=1
zinit light jeffreytse/zsh-vi-mode
zinit light zsh-users/zsh-autosuggestions
zinit light zsh-users/zsh-completions
zinit light zsh-users/zsh-syntax-highlighting
zinit light Aloxaf/fzf-tab

# Completion styling
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Za-z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':completion:*' menu no
zstyle ':fzf-tab:complete:cd:*' fzf-preview 'ls --color $realpath'
zstyle ':fzf-tab:complete:__zoxide_z:*' fzf-preview 'ls --color $realpath'

# Set up fzf key bindings and fuzzy completion
source <(fzf --zsh)
#
# [ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
# export PATH="/opt/homebrew/opt/go@1.22/bin:$PATH"
function gitstash() {
    git stash push -m "zsh_stash_name_$1"
}

function gitstashapply() {
    git stash apply $(git stash list | grep "zsh_stash_name_$1" | cut -d: -f1)
}
