<div align="center">

<img src="public/favicon.svg" width="72" alt="DSH Dynamic Island logo" />

# 🛰️ DSH Dynamic Island

**A tiny glass companion for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — it breathes while the agent thinks, pulses while it works, and politely checks with you before touching anything.**

🍎 Liquid Glass looks · 🌱 zero extra dependencies · 👀 always knows what your agent is up to

[中文](README.zh.md) · [MIT](LICENSE)

</div>

---

> **Status: a high-fidelity design prototype** — the place where a Dynamic Island for DeepSeek Harness gets designed, iterated, and proven before it becomes a real plugin. ⭐ Star it to keep the island in orbit.

---

## 🪟 The island, in the wild

| Chilling over the workspace | Opens when it needs you | Leaves a tiny receipt |
|---|---|---|
| <img src="public/screens/island-1.png" width="320" alt="island over the workspace" /> | <img src="public/screens/island-2.png" width="320" alt="island expanded" /> | <img src="public/screens/island-3.png" width="320" alt="island after a task" /> |

The island lives quietly in the corner of your workspace. The moment your agent starts doing something worth knowing about — thinking, running a tool, waiting for your approval, or hitting a snag — it springs to life.

## 🧭 What is this?

`dsh-dynamic-island` is a high-fidelity, Apple **Liquid Glass**–inspired Dynamic Island concept for DeepSeek Harness. It turns the agent's inner life — thinking, tool calls, approvals, failures, completion — into a lightweight, readable, *slightly companion-like* surface that sits on the edge of your screen.

This is **not** an unrelated desktop pet. Every shape change comes from real Harness state: you always know whether the agent is working, what it's doing, whether it needs your call, and how the task ended.

## ✨ Why you'll like it

- 🍬 **Genuine Liquid Glass** — layered transparency, springy shapes, and light that actually moves. All hand-rolled CSS, no UI library.
- 🎯 **Status first, always** — the companion's face, core light, edge color, and words all tell the same story. No fake animations pretending to be "AI thinking".
- 🤫 **Low-disturbance by design** — it stays a quiet dot until something matters. When a task completes it leaves a short receipt, then settles back down.
- 🛡️ **Respectful of your call** — approvals mirror the harness's native input area: the island is a second, synchronized place to act, never a rogue state machine.
- ♿ **Accessible & polite** — respects `prefers-reduced-motion`, never relies on color alone, and keeps approval actions as real buttons.
- 🌱 **Zero runtime dependencies** — React and a sprinkle of CSS. Nothing else.

## 🎨 The five moods

| Mood | The vibe | Tone |
|---|---|---|
| 🛰️ Idle | `agent/status: idle` — a quiet dot that says "ready when you are" | slate |
| 🧠 Thinking | Breathing core; capsule shows the current task & step | aqua |
| 🛠️ Working | Teal pulse while a tool runs — name and progress on screen | mint |
| 🫵 Approval | Warm coral edge — expands with real 批准 / 暂不 buttons | coral |
| ✅ Complete | A soft refractive highlight + a result receipt + a stack of recent wins | lime |
| ⚠️ Alert | Orange pause — failure summary and a way back in | amber |
| 🔒 Blocked | `turn/end {blocked}` — the goal paused, waiting for you to unblock | violet |
| ✂️ Max-tokens | `turn/end {max-tokens}` — output truncated, ask it to continue | rose |

## 🔌 How it talks to DeepSeek Harness

The concept maps each Harness signal to one island mood — a narrow, versionable client protocol instead of drowning in the raw event stream:

| Island mood | DSH signal |
|---|---|
| `idle` | `agent/status: idle` |
| `thinking` | `agent/status: running`, `step/start`, `assistant/chunk` (reasoning-delta) |
| `working` | `tool/call` → the matching `tool/result` (incl. `error` / `meta`) |
| `approval` | a pending approval in the composer |
| `complete` | a successful `turn/end` + `assistant/message.usage` |
| `alert` | `tool/result` error, `agent/request-error`, `turn/end {error}` |
| `blocked` | `turn/end {blocked}` |
| `max-tokens` | `turn/end {max-tokens}` |

On top of the eight moods, each state also carries **payload fields** (stream, tool cards, receipt, goal, todos, jobs):

| Island element | DSH signal |
|---|---|
| Streaming preview (reasoning vs. answer tinted) | `assistant/chunk` (`text-delta` / `reasoning-delta`) |
| Tool-command cards (exit code / duration / copy) | `tool/call.arguments` + `tool/result` |
| Result receipt (files / checks / tokens / duration) | `turn/end.reason` + `assistant/message.usage` |
| Goal progress ring | goal package: `roundsStarted` / round cap |
| Todo ticker + three-state checklist | `todo/write` (whole-list snapshot, last-write-wins) |
| Background job chips | jobs package: `running \| stopping \| completed \| killed \| failed` + `detail` |
| Recent-wins receipt stack | `turn/end` sequence |
| Model badge | `request/context` (provider · model) |
| Stop / retry / unblock / continue | `agent/turn-stopping` / `agent/request` / goal unblock / turn resume |
| Subagent note | `subagent/start` / `subagent/end` |

> Replay & persistence read `session/event`; live interaction reads `agent/*`. A production plugin still needs to pin down the client slot/connection injection points — and rules for no active session, a dropped stream, parallel sessions, and HMR reloads. That work is tracked on the [roadmap](#-roadmap).
>
> The full "what DSH needs × what the signal layer can do × how the island shows it" analysis lives in [docs/analysis.md](docs/analysis.md).

## 🚀 Run it

```sh
npm install
npm run dev
```

Open the address Vite prints — the `灵动岛演示` dock at the bottom flips between the eight moods:

- In **approval**, hit 批准 / 暂不 and watch the island reflect the result instantly;
- Hit 查看过程 to expand the in-island activity feed: tool cards with exit code, duration, and a one-click copy of the command;
- Hit 清单 to expand the full three-state task checklist; the goal ring shows goal round progress;
- **Retry** on alert, **unblock** when blocked, **continue** past max-tokens (stop is left to the native Harness UI);
- A model badge shows the model in use (replacing the background-job chips);
- **Drag** the island from any blank spot to reposition it — the spot is remembered across reloads;
- Press **⌘K** (or Ctrl+K) for the command palette — type to filter, ↑↓ to move, ↵ to run;
- Hit ▶ 自动演示 to watch the whole arc — idle → thinking → working → approval (auto-approved) → complete — and press **Esc** to tuck the island away at any time.

## 🔌 Integrating into DSH (plugin)

This project **is** a DSH client plugin — the repo root is the dual-face package, published to npm as `dsh-dynamic-island`:

```sh
# Install straight into Harness (web profile)
dsh plugin --profile web add dsh-dynamic-island
dsh --profile web          # restart → the island floats over the GUI, draggable, position remembered

# Or as a regular dependency (dev / referencing the browser half)
npm install dsh-dynamic-island
```

For local development you can also install from source (`npm run build:plugin` emits `lib/client.js`, then `dsh plugin --profile web add /path/to/this-repo`).

Every mechanism is verified against the DeepSeek Harness source:

- **Mount point**: the Web GUI's `shell.overlay` floating slot (ui-layout's additive list seat reserved for frame-wide overlays — badges, toasts, status pills — currently with zero registrants). No changes to `apps/web` are needed.
- **Shape**: dual-face npm package — `dsh.client` declaration + `exports["./client"]` browser half (`lib/client.js`, built by `scripts/build-plugin.mjs` as a `__ModuleLoader__.load` closure factory with platform-table externs) + an empty node half (`src/index.js`). Installed with one command, `dsh plugin --profile web add <pkg>`.
- **Data**: the browser half subscribes `ctx.sessions.currentProvideInfo` → session snapshot + projections (`goal`, `todos`, `tokenUsage`, `contextPressure`, `permissions`) → `src/plugin/protocol.js` derives the island model → the **same** `src/components` React tree renders it (demo and plugin share one UI).

In-repo pieces: `src/client/` (browser half: `index.js`, `IslandDock.jsx`, `island-store.js`, `live-bridge.js`, `styles.js`, `locales.js`), `src/index.js` (node half), `cordis.patch.yml`, `src/plugin/protocol.js` (protocol adapter). The full blueprint, dev workflow, and honest gaps live in [`docs/integration.md`](docs/integration.md).

## 🧱 Built with

- **React 19** + **Vite 8** — plain and fast
- **Hand-rolled CSS** — every glass panel, orbit, and breathing core is bespoke
- **Zero UI frameworks** — the point is proving the design, not the stack

## 🗺️ Roadmap

- [x] Eight-state island with Liquid Glass looks (incl. idle / blocked / max-tokens)
- [x] Synchronized approval actions (a mirror of the native input area)
- [x] Streaming output preview (`assistant/chunk`, reasoning vs. answer tinted)
- [x] Tool-command cards (exit code, duration, copy)
- [x] Result receipts (files, checks, tokens, duration) + recent-wins receipt stack
- [x] Goal progress ring + full task checklist (goal, `todo/write`)
- [x] Model badge (`request/context`, shows the model in use)
- [x] ⌘K command palette + auto-play demo
- [x] Integration blueprint + plugin skeleton (repo root is the dual-face client package)
- [x] `build:plugin` emits the loader-compliant bundle; smoke-tested (handshake / factory / apply / bridge / verbs)
- [ ] Real-GUI integration pass (live-bridge on-device check + retry/continue/unblock/approve wired to real remotes) 🚀

## 💛 Keep the island in orbit

If this made you smile, hit the ⭐ — it's the fuel that turns a design prototype into a real plugin. Issues, ideas, and "why not also support X?" are all welcome.

Built with 🫶 for the DeepSeek Harness community.
