# personas

Launch and switch named **skill profiles** in pi. A persona is a named set of
skills (plus optional model, thinking level, and appended system prompt). Instead
of loading every installed skill into every session, you pick the persona(s) that
fit the task, so context stays lean.

## How it works

pi is launched with `--no-skills`, which tells pi to load **only** the skill paths
that extensions contribute at runtime. This extension listens for pi's
`resources_discover` event and feeds back the skill directories for the currently
active persona(s). Because `resources_discover` fires on startup **and** on every
`/reload`, personas can also be switched mid-session.

The `pi` shell function in `~/.zshrc` adds `--no-skills` automatically:

```sh
pi                     # default persona = coding-focused DevOps/SWE toolkit
pi --persona full      # every installed skill (incl. superpowers)
pi --persona minimal   # only that persona's skills
pi --persona base,observability   # union of two personas
```

Escape hatches (bypass `--no-skills` for one run):

```sh
PI_ALL_SKILLS=1 pi ...   # keep the function but skip --no-skills
command pi ...           # bypass the function entirely (raw pi)
```

## In-session commands

```
/persona                 show active personas + the full list
/persona list            list every persona with its description
/persona skills          list the skills resolved from the active set (name + source path)
/persona set a,b         replace the active set (reloads skills)
/persona add name        add a persona to the active set (union)
/persona remove name     drop a persona
/persona reset           back to the default persona
```

Switching runs `/reload` under the hood, so the new skill set (and any model /
thinking / prompt overrides) takes effect immediately. The active set is stored in
the session, so it survives `/reload` and `/resume`.

## Spawned agents

New tmux agents can be launched with a persona: `spawn_agent`/`/spawn` take a
`persona` parameter, `/dispatch` picks one from its driver, and the `tmux-agent`
engine takes `--persona <names>`. This works for fresh spawns only. A forked
session restores the persona stored in the session it forked from, so the flag is
dropped there and the tool says so; use `/persona set` in the new window instead.

Subagents get their persona from the `persona:` frontmatter key in
`~/.pi/agent/agents/*.md`.

## Config

`~/.pi/agent/personas.json` (symlinked from `~/.dotfiles/.pi/agent/personas.json`).
A project can override or extend it with `<project>/.pi/personas.json`.

```jsonc
{
  "defaultPersona": "base",            // used when no --persona is given
  "skillRoots": [                        // where skills are discovered
    "~/.pi/agent/skills",
    "~/.local/share/caveman/skills",
    "~/.pi/agent/npm/node_modules/*/skills",  // * expands one path segment
    "~/.pi/agent/git/*/*/*/skills"            // git-installed pi packages
  ],
  "personas": {
    "default": {                                          // coding-focused DevOps/SWE toolkit
      "extends": ["base"],
      "skills": ["code-review", "implement", "tdd"]
    },

    "full": {
      "skills": ["*"]                                    // "*" = every discovered skill
    },

    "superpowers": {
      // a directory = all skills under it
      "skills": ["~/.pi/agent/git/github.com/obra/superpowers/skills"],
      "appendSystemPrompt": "@~/.pi/agent/git/github.com/obra/superpowers/skills/using-superpowers/SKILL.md"
    },

    "example": {
      "description": "Shown in /persona list.",
      "extends": ["base"],               // inherit another persona's skills
      "skills": ["unity-kb", "tdd", "gws-*"],   // by name, or a name glob
      "model": "anthropic/claude-opus-4-8",     // optional, "provider/id"
      "thinking": "high",                        // optional
      "appendSystemPrompt": "Extra rules for this persona."  // optional, or "@~/path/to/file.md"
    }
  }
}
```

### Skill entries

Each entry in a persona's `skills` array can be:

- a **skill name** (the skill's directory name or its frontmatter `name:`), e.g. `tdd`
- a **name glob**, e.g. `gws-*`
- `"*"` meaning **all** discovered skills
- an **absolute or `~` path** to a skill directory, a `.md` file, or a **directory of
  skills** (a root): the latter expands to every skill under it, e.g.
  `~/.pi/agent/git/github.com/obra/superpowers/skills`

### appendSystemPrompt

Either literal text or `@<path>` to a markdown file. With `@`, the file body is
appended (YAML frontmatter stripped), which lets a persona carry a long prompt
without inlining it in JSON. `~` expands to `$HOME`; a relative path resolves
against the directory of the `personas.json` that declared the persona. An
unreadable path is skipped with a `persona:` warning at session start.

### Excluding skills

`exclude` trims skills from the `*` wildcard. Entries use the same forms as `skills`
(name, glob, or a directory/root path). For example, to make a persona everything
except superpowers:

```json
"most": { "skills": ["*"], "exclude": ["~/.pi/agent/git/github.com/obra/superpowers/skills"] }
```

Exclusions only affect the `*` wildcard. A skill listed **explicitly** by any active
persona is always included, so `pi --persona most,superpowers` brings the superpowers
skills back even though `most` excludes them.

Composition rules:

- `extends` is resolved recursively (cycles are ignored).
- Activating multiple personas takes the **union** of their skills; `exclude` lists
  are also unioned, but explicit skills win over any exclude.
- For `model` and `thinking`, the **last** persona in the active list that sets a
  value wins. `appendSystemPrompt` values are concatenated.
- When no persona sets `model` / `thinking`, the extension restores your global
  defaults (captured once at first startup).

## Package-contributed skills

A package extension can contribute skills through the same `resources_discover`
mechanism this extension uses, and that path is not affected by `--no-skills`.
Skills contributed that way are present regardless of the active persona, and a
persona `exclude` will not drop them. pi has no hook for gating an extension
itself: extensions load from `packages` before any persona is resolved, and no
event lets one extension unload another.

The lever is package filtering in `~/.pi/agent/settings.json` (see pi's
`docs/packages.md`). Disable the package's extensions, then let a persona load its
skills from the checkout. Superpowers is wired up this way:

```json
"packages": [
  { "source": "git:github.com/obra/superpowers", "extensions": [] }
]
```

That drops the vendor extension, which contributed the 14 skill paths on every
launch and injected the whole `using-superpowers` skill (~1.1k tokens) into every
session. `pi update --extensions` still keeps the checkout current, the
`superpowers` persona loads the skills from it, and that persona's
`appendSystemPrompt` reproduces the bootstrap only when it is active.

Declared package skills (`pi.skills` in the package manifest) need no filter:
`--no-skills` already suppresses them, so they stay available for escape-hatch
runs without leaking into persona-gated ones.

## Debugging

Set `PERSONAS_DEBUG=1` to print the resolved activation (active names, skill dir
count, and each contributed path) to stderr on startup:

```sh
PERSONAS_DEBUG=1 pi --persona unity-backend -p "hi"
```

## Files

| Path | Purpose |
|------|---------|
| `~/.dotfiles/.pi/agent/extensions/personas/index.ts` | the extension |
| `~/.dotfiles/.pi/agent/extensions/personas/prompt-source.ts` | `@file` / `~` path resolution for `appendSystemPrompt` |
| `~/.dotfiles/.pi/agent/personas.json` | persona definitions |
| `~/.pi/agent/extensions/personas` -> dotfiles | symlink so pi auto-discovers it |
| `~/.pi/agent/personas.json` -> dotfiles | symlink so the extension finds config |
| `pi()` function in `~/.dotfiles/.zshrc` | adds `--no-skills` on launch |

## Rollback

To fully disable personas and return to normal skill loading:

1. Remove the `pi()` function block from `~/.zshrc` (or run `command pi`).
2. Optionally remove the symlinks:
   `rm ~/.pi/agent/extensions/personas ~/.pi/agent/personas.json`

Removing only step 1 already restores the old behavior: without `--no-skills`,
pi loads all ambient skills again and the extension just adds nothing new.
