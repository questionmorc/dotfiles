# toolset

Named profiles of MCP tools. A toolset decides which MCP tools are **direct**
(full schema in the system prompt on every turn) and which stay behind the `mcp`
proxy (one tool, reachable by search).

Separate from `/persona`. Personas decide who the agent is (skills); toolsets
decide what it is carrying (tools). Mix freely.

## Why

Every direct MCP tool costs its name, description, and JSON schema in the system
prompt, on every turn, in every repo. Measured against Anthropic's
`count_tokens` endpoint:

| Server | Tools | Tokens |
|---|---|---|
| pagerduty-mcp | 101 | 43,742 |
| miro-mcp-server | 35 | 20,626 |
| mcp-rw-jira | 49 | 16,951 |
| grafana | 35 | 12,350 |
| terraform | 46 | 9,259 |
| context7 | 2 | 1,101 |
| **total** | **268** | **104,029** |

Half a context window before you type anything.

## How it works

`pi-mcp-adapter` reads `MCP_DIRECT_TOOLS` at factory time and, when it is set,
ignores every `directTools` field in `mcp.json`
(`direct-tool-surface.ts` `resolveDirectTools`, the `envSelection` branch).

Personal extensions load **before** package extensions, so this extension writes
the variable in its factory and the adapter picks it up on the first turn. No
shell wrapper, no startup reload. Verified: a personal extension named
`zz-probe` still wins the race.

```
MCP_DIRECT_TOOLS="__none__"                       nothing direct
MCP_DIRECT_TOOLS="grafana"                        whole server
MCP_DIRECT_TOOLS="mcp-rw-jira/jira_get_issue"     one tool
```

The adapter matches those literally, with no glob support, so this extension
expands globs against `mcp-cache.json` before writing the value.

## Launch

```sh
pi --toolset observability
pi --toolset base,on-call     # union
pi                            # defaultToolset
```

## In session

```
/toolset               active set + what is available
/toolset list          every toolset with its tool count and token cost
/toolset tools         the tools the active set resolves to, with per-tool cost
/toolset set a,b       replace the active set (reloads)
/toolset reset         back to defaultToolset
```

`set` and `reset` run `/reload`, which replaces the extension runtime and
re-reads the variable. The active set is stored in the session, so it survives
`/reload` and `/resume`.

## Config

`~/.pi/agent/toolsets.json`, symlinked from `~/.dotfiles/.pi/agent/toolsets.json`.
A project can override or extend it with `<project>/.pi/toolsets.json`.

```jsonc
{
  "defaultToolset": "none",
  "toolsets": {
    "none":       { "description": "Proxy only.", "mcp": [] },
    "grafana":    { "mcp": ["grafana"] },
    "on-call":    { "extends": ["grafana"], "mcp": ["pagerduty-mcp/list_incidents"] },
    "everything": { "mcp": ["*"] }
  }
}
```

### Selectors

| Form | Meaning |
|---|---|
| `server` | every tool on that server |
| `server/tool` | one tool |
| `server/glob` | matching tools, e.g. `grafana/query_*` |
| `glob` | matching servers, e.g. `*jira*` |
| `*` | every configured server |

A whole-server selector absorbs that server's individual tool selectors.
Selectors matching nothing are reported rather than silently dropped.

`extends` unions parent selectors first, is transitive, and is cycle-safe.

### Reserved keys

`tools` and `excludeTools` are accepted and ignored. They are the landing spot
for gating pi and extension tools (`web_search`, `kb_*`, `subagent`) through the
same profiles, so that change will not need a rename or a schema break.

## Escape hatches

```sh
MCP_DIRECT_TOOLS=grafana pi     # set it yourself; the extension stands down
```

With no resolvable toolset the extension stays inert and `mcp.json` keeps
control. The status line reads `toolset: off (mcp.json)`.

## Cost estimates

`tokens = 0.28746 * chars + 18.12` per tool, fitted against exact counts for all
268 cached tools. Median error 6.9%, p90 15.2%, and 1% on the full-catalog
aggregate. Status-line accuracy, not billing accuracy.

## Tests

```sh
node --test
```
