# DSH Dynamic Island / DSH 灵动岛

`dsh-dynamic-island` is a high-fidelity interactive prototype for DeepSeek Harness: an Apple Liquid Glass–inspired Dynamic Island that turns the agent's thinking, tool execution, approvals, failures, and completion into a lightweight, readable, companion-like workspace surface. This is not an unrelated desktop pet — every shape change of the character comes from real Harness state, so the user always knows whether the agent is working, what it is doing, whether confirmation is needed, and how the task ended.

`dsh-dynamic-island` 是一个面向 DeepSeek Harness 的高保真交互原型：用 Apple Liquid Glass 风格的灵动岛，把 Agent 的思考、工具执行、审批、异常和完成状态变成轻量、可读、有一点陪伴感的工作界面。这不是一只与任务无关的桌宠。角色的每一次形态变化都应该来自真实的 Harness 状态，用户始终能知道 Agent 是否在工作、正在做什么、是否需要确认以及任务结果如何。

## Run / 运行

```sh
npm install
npm run dev
```

Open the local address printed by Vite to view the prototype. The `灵动岛演示` state dock at the bottom switches between five states: thinking, working, approval, complete, and alert. In the approval state, the “批准” (approve) and “暂不” (not now) actions keep driving the local state.

打开 Vite 输出的本地地址即可查看原型。底部的 `灵动岛演示` 状态栏可以切换五种状态：思考、执行、确认、完成、异常。确认状态中的“批准”和“暂不”会继续驱动本地状态变化。

## Design Decisions / 设计决策

- **Companion Island**: collapses into a status dot by default and expands into a springy glass form when a task event happens. / 平时收缩为状态点，发生任务事件时以带回弹的玻璃形态扩展。
- **Status first**: the character's expression, core light, edge color, and text jointly express the state — no animation fakes the model's thinking process. / 角色的表情、核心光源、边缘色和文本共同表达状态，不用动画伪造模型思考过程。
- **Low disturbance**: expands only on key task changes; after completion leaves a short receipt, then settles back into a quiet status dot. / 只有任务发生关键变化时才扩展；完成后留下短暂收据，再恢复为安静的状态点。
- **Accessible**: supports `prefers-reduced-motion`; state is never conveyed by color alone; approval keeps operable text buttons. / 支持 `prefers-reduced-motion`，状态不依赖颜色单独表达，审批保留可操作的文字按钮。
- **Performance**: main animations use `transform`, `opacity`, and controlled width transitions; the eventual production implementation should avoid sustained large-area `backdrop-filter`. / 主要动画使用 `transform`、`opacity` 和受控的宽度过渡；后续正式实现应避免持续动画大面积 `backdrop-filter`。

## Event Mapping with DSH / 与 DSH 的事件映射

The local Harness engineering docs confirm the following boundaries. A production plugin should translate host-side events into a narrow, versionable client state protocol instead of consuming the full session event stream directly.

本地 Harness 工程的架构文档确认了以下边界。正式插件应将 Host 侧事件转为一个窄的、可版本化的客户端状态协议，而不是让组件直接消费全部会话事件。

| Companion state / 状态 | DSH signal / 信号 | Visual behavior / 视觉行为 |
|---|---|---|
| `thinking` / 思考 | `agent/status: running`、`step/start`、LLM 流开始 | Core breathing; capsule shows the current task and step / 核心呼吸，胶囊显示当前任务和步骤 |
| `working` / 执行 | `session/event: tool/call`，等待对应 `tool/result` | Teal execution pulse; shows tool name and progress / 青绿色执行脉冲，显示工具名和进度 |
| `approval` / 确认 | 用户审批事件 / 审批 composer 待处理状态 | Warm coral edge; expands with approve / not-now actions / 暖珊瑚边缘，扩展出批准/暂不动作 |
| `complete` / 完成 | `turn/end` 后的成功状态 | Slight refractive highlight; shows the task result receipt / 轻微折射高光，展示任务结果收据 |
| `alert` / 异常 | `tool/result` error、`agent/request-error` | Orange-red pause; failure summary and a handling entry / 橙红色停顿，提示失败摘要和处理入口 |

Persistence and replay read primarily from `session/event`; live interaction reads primarily from `agent/*` signals. A production implementation still needs to confirm the client slot/connection injection points allowed by the current version, and to add state rules for: no active session, a disconnected event stream, multiple parallel sessions, and HMR reloads.

持久化与回放优先读取 `session/event`；实时交互优先读取 `agent/*` 信号。正式实现还需要确认当前版本允许的 client slot/connection 注入点，并为没有活动会话、事件流断开、多个会话并行和 HMR 重载补充状态规则。

## Directory / 目录

```text
src/App.jsx       # Prototype app and local state flow / 原型应用与本地状态流转
src/App.css       # Glass material, island animations, responsive layout / 玻璃材质、灵动岛动效和响应式布局
src/index.css     # Base fonts and global reset / 基础字体和全局重置
```

This is a standalone directory for design validation; it does not modify the local DeepSeek Harness source code.

这是设计验证用的独立目录，不会修改本地 DeepSeek Harness 源码。
