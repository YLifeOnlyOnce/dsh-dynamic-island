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
| 🧠 Thinking | Breathing core; capsule shows the current task & step | aqua |
| 🛠️ Working | Teal pulse while a tool runs — name and progress on screen | mint |
| 🫵 Approval | Warm coral edge — expands with real 批准 / 暂不 buttons | coral |
| ✅ Complete | A soft refractive highlight + a tiny result receipt | lime |
| ⚠️ Alert | Orange pause — failure summary and a way back in | amber |

## 🔌 How it talks to DeepSeek Harness

The concept maps each Harness signal to one island mood — a narrow, versionable client protocol instead of drowning in the raw event stream:

| Island mood | DSH signal |
|---|---|
| `thinking` | `agent/status: running`, `step/start`, LLM streaming begins |
| `working` | `session/event: tool/call` → the matching `tool/result` |
| `approval` | a pending approval in the composer |
| `complete` | a successful `turn/end` |
| `alert` | `tool/result` error, `agent/request-error` |

> Replay & persistence read `session/event`; live interaction reads `agent/*`. A production plugin still needs to pin down the client slot/connection injection points — and rules for no active session, a dropped stream, parallel sessions, and HMR reloads. That work is tracked on the [roadmap](#-roadmap).

## 🚀 Run it

```sh
npm install
npm run dev
```

Open the address Vite prints — the `灵动岛演示` dock at the bottom flips between the five moods. In **approval**, hit 批准 / 暂不 and watch the island reflect the result instantly.

## 🧱 Built with

- **React 19** + **Vite 8** — plain and fast
- **Hand-rolled CSS** — every glass panel, orbit, and breathing core is bespoke
- **Zero UI frameworks** — the point is proving the design, not the stack

## 🗺️ Roadmap

- [x] Five-state island with Liquid Glass looks
- [x] Synchronized approval actions (a mirror of the native input area)
- [ ] Streaming output preview as the agent writes
- [ ] Tool-command cards (exit code, duration, copy)
- [ ] Result receipts (files changed, checks passed)
- [ ] A real `dsh-dynamic-island` plugin for DeepSeek Harness 🚀

## 💛 Keep the island in orbit

If this made you smile, hit the ⭐ — it's the fuel that turns a design prototype into a real plugin. Issues, ideas, and "why not also support X?" are all welcome.

Built with 🫶 for the DeepSeek Harness community.
