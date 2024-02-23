# My dotfiles

This directory contains the dotfiles for my system

## Requirements

Ensure you have the following installed on your system

### Git

`apt-get install git`  
`brew install git`

### Stow


`apt-get install stow`  
`brew install stow`

## Installation

First, check out the dotfiles repo in your $HOME directory using git

```
$ git clone git@github.com:questionmorc/dotfiles.git
$ cd dotfiles
```

then use GNU stow to create symlinks

```
$ stow .
```

