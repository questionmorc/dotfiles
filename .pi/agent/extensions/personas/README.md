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
/persona set a,b         replace the active set (reloads skills)
/persona add name        add a persona to the active set (union)
/persona remove name     drop a persona
/persona reset           back to the default persona
```

Switching runs `/reload` under the hood, so the new skill set (and any model /
thinking / prompt overrides) takes effect immediately. The active set is stored in
the session, so it survives `/reload` and `/resume`.

## Config

`~/.pi/agent/personas.json` (symlinked from `~/.dotfiles/.pi/agent/personas.json`).
A project can override or extend it with `<project>/.pi/personas.json`.

```jsonc
{
  "defaultPersona": "default",          // used when no --persona is given
  "skillRoots": [                        // where skills are discovered
    "~/.pi/agent/skills",
    "~/.local/share/superpowers/skills",
    "~/.local/share/caveman/skills",
    "~/.pi/agent/npm/node_modules/*/skills"   // * expands one path segment
  ],
  "personas": {
    "default": {                                          // coding-focused DevOps/SWE toolkit
      "extends": ["base"],
      "skills": ["~/.pi/agent/npm/node_modules/pi-lens/skills", "code-review", "implement", "tdd"]
    },

    "full": {
      "skills": ["*"]                                    // "*" = every discovered skill
    },

    "superpowers": {
      "skills": ["~/.local/share/superpowers/skills"]    // a directory = all skills under it
    },

    "example": {
      "description": "Shown in /persona list.",
      "extends": ["base"],               // inherit another persona's skills
      "skills": ["unity-kb", "tdd", "gws-*"],   // by name, or a name glob
      "model": "anthropic/claude-opus-4-8",     // optional, "provider/id"
      "thinking": "high",                        // optional
      "appendSystemPrompt": "Extra rules for this persona."  // optional, or "@/path/to/file.md"
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
  `~/.local/share/superpowers/skills`

### Excluding skills

`exclude` trims skills from the `*` wildcard. Entries use the same forms as `skills`
(name, glob, or a directory/root path). For example, to make a persona everything
except superpowers:

```json
"most": { "skills": ["*"], "exclude": ["~/.local/share/superpowers/skills"] }
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

## Known caveat: pi-lens

`pi-lens` contributes its own 4 skills (`ast-grep`, `lsp-navigation`,
`write-ast-grep-rule`, `write-tree-sitter-rule`) through the same
`resources_discover` mechanism, which is not affected by `--no-skills`. Those 4
skills are therefore always present, regardless of the active persona. They are
lightweight navigation utilities, so this is usually fine. To drop them entirely,
launch with `--no-lens` (disables pi-lens for that session).

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
