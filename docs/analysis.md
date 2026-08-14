# DSH 灵动岛 · 内容与交互扩充分析

> 结论先行：灵动岛不缺「可展示的东西」——DeepSeek Harness 的事件面已经足够丰富，
> 缺的是把真实信号翻译成低打扰、状态优先的岛上内容的**客户端协议**。
> 本文按「DSH 需要什么」→「信号层能不能做到」→「岛怎么呈现」三层展开，
> 所有信号均来自 Harness 源码（`packages/core/session/src/types.ts`、
> `packages/core/agent/src/runtime-types.ts`、`packages/core/scope/src/scoped-events.generated.ts`）。

---

## 一、DSH 需要什么：按「人需要知道的事」拆解

灵动岛是给**人**看的，所以先从人的视角列需求，再找信号。

| # | 人需要知道 | 典型时刻 | 对应真实信号 |
|---|---|---|---|
| 1 | **它在干活吗** | agent 启动、空闲、跑动 | `agent/status`（`idle \| running`） |
| 2 | **在想还是在做** | 模型调用前 / 工具执行中 | `agent/pre-step`、`agent/request`、`agent/request-error` |
| 3 | **正在写什么** | LLM 流式输出 | `assistant/chunk`：`text-delta` / `reasoning-delta` / `tool-call-delta` |
| 4 | **在调什么工具、结果如何** | 工具执行 | `tool/call`（name + 原始参数 JSON + callId）→ `tool/result`（消息 / `error{name,code}` / 工具私有 `meta`） |
| 5 | **任务清单走到哪了** | todo 变化 | `todo/write`：整表快照 `TodoItem[] {content, status}` |
| 6 | **进行到第几步** | 每轮模型调用 | `step/start` / `step/end`（turn/step 计数） |
| 7 | **需要我拍板吗** | 审批 | composer 中挂起的审批（岛是同步镜像入口，不是独立状态机） |
| 8 | **结果如何、花了多少** | 回合收尾 | `turn/end` reason（`completed / aborted / blocked / error / max-tokens / interrupted`）+ `assistant/message` 的 `usage`（input/output/cache/reasoning tokens） |
| 9 | **出错了怎么办** | 工具失败 / 请求失败 | `tool/result.error`、`agent/request-error`、`turn/end {error \| blocked}` |
| 10 | **是哪个模型在跑** | 上下文变化 | `request/context`（provider / model / contextWindow）、`request/header` |
| 11 | **它有没有派子代理** | 委托 | `subagent/start` / `subagent/end` |
| 12 | **我发的消息收到没** | 入队 / 被认领 | `agent/inbox/inserted`、`agent/inbox/claimed`、`user/message.source`（direct human / agent.inject / goal） |
| 13 | **我要打断它** | 用户取消 | `agent/turn-stopping`（取消请求已发出） |

> 注意：`user/message.source` 能区分「你发的」与「系统注入的上下文」（文件变更通知、
> AGENTS.md、技能内容、cron 通知、goal 续跑），岛可以在注入类消息时给出「不是我说的」的淡提示。

---

## 二、信号层能不能做到：可行性边界

### 2.1 完全可行（现有事件流即可消费，无需改核心）

- **流式输出预览**：`assistant/chunk` 的 `reasoning-delta` 与 `text-delta` 天然可分色——
  「思考中」显示推理流，「执行中」显示正文/工具流。这就是岛最「灵动」的一刻。
- **工具命令卡**：`tool/call` 的 `name` + `arguments`（模型原始 JSON 字符串，可直接复制），
  `tool/result` 定生死（error 有无）+ `meta`（如 `dsh-tool-fs` 携带的结果时上下文 diff）。
- **结果小票**：`turn/end` 的 reason 决定成败帧，`usage` 提供 tokens 统计，
  `todo/write` 提供「N/M 项完成」的清单总结，`session-title` 提供一句话标题。
- **Todo 清单点**：`todo/write` 是整表快照、last-write-wins——岛只需读最新一张表，
  天然幂等，重放无歧义。
- **模型徽章 / 委托指示 / 停止与重试**：`request/context`、`subagent/start|end`、
  `agent/turn-stopping`、`agent/request-error` 都是现成的。
- **步骤进度**：`step/start` / `step/end` 可直接推出 `02 / 06`。

### 2.2 需要约定（客户端协议层，非核心改动）

- **状态合并规则**：`agent/*`（实时）与 `session/event`（持久可重放）必须合并成一条
  窄协议（如 `mood` 五态 + 载荷），而不是让岛直吞原始事件流——README 已有此设计，
  扩充后协议负载变为：`{mood, step, todo, stream, tools[], receipt}`。
- **待钉死的插件注入点**（沿用 README roadmap）：client slot / 连接注入、无活跃会话、
  断流、并行会话、HMR 重载的规则——这是把原型变成插件的剩余工作，不影响本分析中的任何呈现能力。

### 2.3 明确不做（或仅作原型示意）

- 岛**不驱动**底层状态：审批、停止、重试都只是「镜像操作入口 + 本地乐观反馈」，
  真实执行仍在 Harness 原生面（与现有 `批准/暂不` 的设计一致）。
- 不做「假装 AI 思考」的无意义动画；每个形状变化都必须有对应事件。

---

## 三、岛怎么呈现：本次原型落地的内容与交互

### 3.1 展示内容（六类新载荷）

| 岛上元素 | 载荷来源 | 呈现 |
|---|---|---|
| 流式预览行 | `assistant/chunk`（reasoning/text delta） | 打字机效果 + 闪烁光标；`prefers-reduced-motion` 下直接显示全文 |
| 过程面板（活动流） | `step/start`、`tool/call+result`、`todo/write`、`assistant/message`、`subagent/start|end` | 岛内可滚动的时间线：步骤标记、工具卡、todo 变化、正文/推理行、系统注记 |
| 工具命令卡 | `tool/call` + `tool/result` | 工具名 + 参数（mono、可复制）+ 退出码胶囊（`exit 0` / `exit 1` / `待审批`）+ 耗时 |
| 结果小票 | `turn/end` reason + `usage` + `todo/write` | 统计条：文件数 · 检查数 · 输出 tokens · 缓存命中 · 用时 |
| Todo 清单点 | `todo/write` | 圆点进度（done / active / pending）+ 当前任务一行 |
| 模型徽章 | `request/context`（provider · model） | 顶栏小胶囊，如 `deepseek · r1-0528` |

### 3.2 交互（四类新操作）

| 交互 | 对应真实动作 | 原型实现 |
|---|---|---|
| 查看过程（过程面板展开/收起） | 回放 `session/event` 摘要 | 「查看过程」按钮 + 旋转箭头，面板动画展开、自动滚动到底 |
| 停止 | `agent/turn-stopping` 取消请求 | working 态「停止」按钮 → 反馈「已请求停止」并追加系统注记 |
| 重试 | 重新发起（`agent/request`） | alert 态「重试」按钮 → 反馈后跳回执行态 |
| 复制命令 | 取 `tool/call.arguments` 原文 | 工具卡上的复制按钮，短暂变 ✓ |
| ⌘K 命令面板 | 顶部/状态栏的命令入口 | 过滤 5 态 + 展开/过程动作；↑↓ 选择、↵ 执行、Esc 关闭 |
| 自动演示 | 无（原型专属） | 按时间线播一遍 thinking → working → approval（自动批准）→ complete |

### 3.3 设计约束（延续既有原则）

- 状态第一：核心、光晕、边框色、文案讲同一个故事；
- 低打扰：默认仍是小点/胶囊，过程按需展开；
- 无障碍：`prefers-reduced-motion`、不只用颜色传达（退出码胶囊带文字）、按钮是真实 button；
- 零依赖：依旧只有 React + 手写 CSS。

---

## 四、与 README 既有映射表的差异

旧表 5 行（thinking/working/approval/complete/alert）；新协议在保持五态的同时，
为每个 mood 补充**载荷字段**，并新增 4 条信号映射：

```
thinking  ← agent/status:running + step/start + assistant/chunk(reasoning-delta)
working   ← tool/call → tool/result（含 error / meta）
approval  ← composer 挂起审批
complete  ← turn/end{completed} + usage + todo/write
alert     ← tool/result.error / agent/request-error / turn/end{error|blocked}
新增：
todo/write            → 清单点
assistant/chunk       → 流式预览
request/context       → 模型徽章
agent/turn-stopping   → 停止反馈
subagent/start|end    → 委托注记
```

---

## 五、还能往哪里丰富（后续方向清单）

> 可行性标注：✅ 真实信号现成，直接可做 ｜ 🔧 信号存在但需先定协议翻译规则
> ｜ 🧪 原型阶段只能 demo 数据示意 ｜ ❌ 不建议（违背设计原则）

### A. 任务类（把「任务」做成岛的一等公民）

| 方向 | 信号依据 | 可行性 |
|---|---|---|
| **目标进度**：目标 → 任务 → 步骤三层结构，顶部目标环/条显示「进行到第 N 轮 / 共 M 轮」 | goal 包：`roundsStarted` 与轮次上限；配套 `todo/write`、`step/start` | ✅ |
| **完整任务清单**：过程面板里展开成三态 checklist（pending / in_progress / completed，完成划线） | `todo/write` 整表快照（已有 ticker，可加展开视图） | ✅ |
| **后台任务胶囊**：与 agent 主线并行的独立 job 状态小胶囊（构建中/失败/已杀），失败可点击看 `detail`（如 `exit code: 3`、`max-tokens`） | jobs 包：`JobStatus = running \| stopping \| completed \| killed \| failed` + `detail` | ✅ |
| **任务小票堆**：完成小票不消失，叠成「最近任务」堆，点击回看 | `turn/end` 序列 + `session-title` | 🔧 |
| **多任务/多会话**：并行会话数、可点切换 | README 已列为协议待定项 | 🔧 |

### B. 生命周期与新增情绪（五态 → 更多子帧）

| 方向 | 信号依据 | 可行性 |
|---|---|---|
| **idle 待命态**：`agent/status: idle` 现在完全没用上——岛应有「待命」情绪（安静小点、偶尔眨眼、显示「随时吩咐」），低打扰闭环的关键一块 | `agent/status: idle` | ✅ |
| **blocked / max-tokens / aborted 细分**：`turn/end` 有 6 种 reason，目前只用 completed→lime、error→amber | `turn/end.reason`：`blocked` / `max-tokens` / `aborted` / `interrupted` | ✅ |
| **恢复会话态**：「已从断点恢复」提示；会话创建/销毁 | `session/end-seed`、`request/header.reason: resume`、`agent/created\|disposed` | 🔧 |

### C. 上下文与用量（长会话真实痛点）

| 方向 | 信号依据 | 可行性 |
|---|---|---|
| **上下文用量表**：第二根进度条「上下文用量 42%」——对长会话极有用 | `request/context.contextWindow` + `assistant/message.usage` 累计 input/output | ✅ |
| **tokens 明细**：推理 tokens、缓存写入拆分，hover 看明细 | `usage.reasoningTokens` / `cacheWriteTokens` | ✅ |
| **工具集徽章**：「12 个工具可用」，本回合用了几种 | `request/header.tools` 数量 + `tool/call` 计数 | ✅ |

### D. 感知与通知（agent 在外部世界发生的事）

| 方向 | 信号依据 | 可行性 |
|---|---|---|
| **外部文件变化**：「检测到文件变化：src/App.jsx」淡提示（不是你发的、也不是 agent 改的） | `user/message.source` 的 `agent.inject`（文件变更通知、cron、AGENTS.md…） | ✅ |
| **定时任务提醒**：「14:30 定时任务将执行」 | schedule 包（cron 工具） | 🔧 |
| **消息入队反馈**：「你的消息已入队 → 已认领开始处理」两段式；被丢弃时提醒 | `agent/inbox/inserted\|claimed\|discarded` | ✅ |
| **反馈已记录**：点赞/反馈后的确认 | `feedback/record` 会话事件 | ✅ |

### E. 陪伴感（克制地做）

| 方向 | 信号依据 | 可行性 |
|---|---|---|
| **会话日报/累计**：「今天完成 12 个任务 · 推理 8.4k tokens」 | `turn/end` + `usage` 跨会话累计 | 🔧 |
| **委托可视化**：「2 个子代理并行中」，展开成小分支 | `subagent/start\|end`（含 depth） | 🔧 |
| **按时刻问候**：idle 时「晚上好」 | `agent/status: idle` + 本地时间 | 🧪 |
| **大功告成闪光**：大任务完成时一次折射闪光（已有 lime 高光，可加闪光帧） | `turn/end{completed}` + 规模判断 | 🧪 |

### F. 交互层

| 方向 | 说明 | 可行性 |
|---|---|---|
| 点击即达 | 工具卡点文件名在 web 里打开该文件；命令卡复制已有 | 🔧 |
| 小票可复制摘要 | 完成态一键复制「任务摘要」文本 | ✅ |
| 时间线 scrub | 过程面板加步进滑块，拖动回看各步骤 | 🧪 |
| 位置记忆/拖拽 | 岛可拖动、记住位置（localStorage，demo 与插件共用 `useDraggable`） | ✅ |
| 键盘扩展 | `1-5` 切情绪、`F` 开关过程面板、`S` 停止 | ✅ |
| ⌘K 增强 | `>` 前缀直接执行命令动作 | ✅ |

### 明确不做

- ❌ 假装思考的无意义动画（违背「状态第一」）
- ❌ 音效/震动（原型无意义，插件里也低优先级）
- ❌ 桌面宠物式随机小动作（低打扰原则）
- ⚠️ 并行会话的语义细节（README 已列为协议待定项，原型里别硬编码）

