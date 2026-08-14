<p align="center">
  <a href="README.zh.md">中文</a>
</p>

# DSH Dynamic Island

`dsh-dynamic-island` is a high-fidelity interactive prototype for DeepSeek Harness: an Apple Liquid Glass–inspired Dynamic Island that turns the agent's thinking, tool execution, approvals, failures, and completion into a lightweight, readable, companion-like workspace surface. This is not an unrelated desktop pet — every shape change of the character comes from real Harness state, so the user always knows whether the agent is working, what it is doing, whether confirmation is needed, and how the task ended.

## Run

```sh
npm install
npm run dev
```

Open the local address printed by Vite to view the prototype. The `灵动岛演示` state dock at the bottom switches between five states: thinking, working, approval, complete, and alert. In the approval state, the “批准” (approve) and “暂不” (not now) actions resolve the approval synchronously inside the island — the island is an additional operable mirror of the native approval card in the harness input area, and never drives the underlying task state itself.

## Design Decisions

- **Companion Island**: collapses into a status dot by default and expands into a springy glass form when a task event happens.
- **Status first**: the character's expression, core light, edge color, and text jointly express the state — no animation fakes the model's thinking process.
- **Low disturbance**: expands only on key task changes; after completion leaves a short receipt, then settles back into a quiet status dot.
- **Accessible**: supports `prefers-reduced-motion`; state is never conveyed by color alone; approval keeps operable text buttons.
- **Performance**: main animations use `transform`, `opacity`, and controlled width transitions; the eventual production implementation should avoid sustained large-area `backdrop-filter`.

## Event Mapping with DSH

The local Harness engineering docs confirm the following boundaries. A production plugin should translate host-side events into a narrow, versionable client state protocol instead of consuming the full session event stream directly.

| Companion state | DSH signal | Visual behavior |
|---|---|---|
| `thinking` | `agent/status: running`, `step/start`, LLM streaming begins | Core breathing; capsule shows the current task and step |
| `working` | `session/event: tool/call`, awaiting the matching `tool/result` | Teal execution pulse; shows tool name and progress |
| `approval` | User approval events / pending approval in the composer | Warm coral edge; expands with approve / not-now actions |
| `complete` | Successful state after `turn/end` | Slight refractive highlight; shows the task result receipt |
| `alert` | `tool/result` error, `agent/request-error` | Orange-red pause; failure summary and a handling entry |

Persistence and replay read primarily from `session/event`; live interaction reads primarily from `agent/*` signals. A production implementation still needs to confirm the client slot/connection injection points allowed by the current version, and to add state rules for: no active session, a disconnected event stream, multiple parallel sessions, and HMR reloads.

## Directory

```text
src/App.jsx       # Prototype app and local state flow
src/App.css       # Glass material, island animations, responsive layout
src/index.css     # Base fonts and global reset
```

This is a standalone directory for design validation; it does not modify the local DeepSeek Harness source code.
