# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt SHARE_HISTORY

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
path+=($HOME/.bin)
path+=($HOME/code/backend/platform/bin)
path+=(/opt/homebrew/Cellar/mysql-client/8.3.0/bin)
#export PATH=$PATH:$HOME/bin
eval "$(mise activate -C ~/code/backend zsh)"
GOROOT="$HOME/.local/share/mise/installs/go/1.22.0"
export LIBRARY_PATH=/opt/homebrew/lib
export K9S_EDITOR=nvim


#autoload -U +X bashcompinit && bashcompinit
#complete -o nospace -C /opt/homebrew/bin/terragrunt terragrunt
eval "$(zoxide init --cmd cd zsh)"
#alias ls="exa"
#alias "ls -ltr"="ls -lsnew"
#alias ll="exa -lgah"
#alias tree="exa --tree"
export KUBE_EDITOR=nvim

autoload -U +X bashcompinit && bashcompinit
complete -o nospace -C /Users/malloul/.local/share/mise/installs/tanka/latest/bin/tk tk
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

