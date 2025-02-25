#!/usr/bin/env bash

if [[ $# -eq 1 ]]; then
    selected=$1
else
    # selected=$(find ~/code -mindepth 1 -maxdepth 1 -type d | fzf)
    selected=$(
        (
            find ~/code -mindepth 1 -maxdepth 1 -type d;
            echo ~/.config/hypr;
            echo ~/dotfiles/.config/nvim;
        ) | fzf
    )
fi

if [[ -z $selected ]]; then
    exit 0
fi
