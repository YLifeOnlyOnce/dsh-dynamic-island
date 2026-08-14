# 把灵动岛集成进 DeepSeek Harness：成为一枚客户端插件

> 结论先行：**可行，而且 DSH 为此预留了现成的座位。** 灵动岛应该做成一枚
> 「双面包」客户端插件包（`dsh.client` 声明 + 浏览器半场 bundle），挂进 Web GUI
> 的 `shell.overlay` 浮层槽 —— 该槽位是 ui-layout 专门为「全屏浮层 / toast / 状态
> 胶囊」预留的加性 list 槽（z-index 20、点击穿透、目前零注册者），注释原话：
> *"This is the additive seat for a frame-wide surface of your own"*。
> 全程无需修改 apps/web 源码，用户侧一条命令即可安装。
>
> 本文所有机制均对照 deepseek-harness 仓库源码核实（路径以仓库根为基准）。

---

## 一、DSH 插件机制速览（30 秒版）

- **一切皆插件**（vendored Cordis）：服务、工具、事件监听、prompt section、UI 都是插件。
- **Profile** = `$DSH_HOME/profiles/<name>/` 的组合清单（`dsh.profile.bundles` 有序 bundle 列表 + 用户自己的 `cordis.patch.yml`）。`web` / `headless` 是内置模板。
- **Bundle** = 一个 npm 包，`package.json` 声明 `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`，patch 是顶层 YAML 数组（`- insert:` 加行 / 按 id 覆盖 config）。加载链：
  `dsh --profile web` → `loadProfile` 逐层解析 patch → `boot()` 挂载 cordis Loader → 装配整棵插件树。
- **UI 插件 = 双面包**：一个包同时有 node 半场（普通插件入口，纯 UI 插件就一个空 `apply(){}`）和浏览器半场（`exports["./client"]` 指向构建出的 `lib/client.js`），并在 `package.json#dsh.client` 声明 `{ platform: 'web', inject: [...] }`。浏览器侧 `dsh-client-modules` 的 node 半场扫描 Loader 条目 → 组装 `window.__DSH_BOOT__` → 在 `/plugins/<id>/client.js` 提供 bundle → 浏览器内核把它当一个 cordis entry 装配。
- **安装**：`dsh plugin --profile web add <pkg>`（转发 pnpm，支持 registry / git / file / 相对路径 `add .`），成功后自动把声明了 `dsh.bundle` 的包并入 profile 的 bundles 列表；重启 `dsh --profile web` 生效。仓库 e2e 已固化「树外 checkout 可直接安装」这一承诺（`apps/cli/tests/built-bin.e2e.ts`）。

## 二、注入点：`shell.overlay` 插槽

| 项 | 值 | 证据 |
|---|---|---|
| 槽位名 | `shell.overlay` | `packages/client/ui-layout/src/client/index.ts:73-83` |
| 形态 | `{ kind: 'list'; scope: 'root' }` | 多条目、应用级（非会话级） |
| 渲染位 | AppFrame 三列 grid 之上的 `.overlayLayer` | `ui-layout/src/client/AppFrame.tsx:193-195` |
| CSS | `position:absolute; inset:0; z-index:20; pointer-events:none`，子元素恢复 `pointer-events:auto` | `AppFrame.module.css:110-118` |
| 现状 | **零注册者**（2026-08 调研时） | `grep -rn "shell.overlay"` 仅声明与渲染位 |

注册代码（浏览器半场 `apply(ctx)` 里）：

```ts
ctx.slots.inject('shell.overlay', () => ctx.slots.register({
  name: 'shell.overlay',
  id: 'dynamic-island',
  order: 100,            // 浮层条目按 order 自排序
  locale: 'island',
}, IslandDock))
```

> 注意：不要注册进 `'root'` 槽 —— 那是 single 槽，会 shadow 掉整个 AppFrame。

## 三、数据通道：岛元素 ↔ 真实数据源

Web GUI 的链路：同源 HTTP + WebSocket（`/api/events.mux`、`/api/events.host`）
→ `ConnectionController` 双流泵 → `SessionRuntime` → 每会话快照 store
（自研 zustand/immer 引擎，rAF 批处理）→ React hooks。
状态管理是 `createSnapshotStore`，无 Redux；事件总线是 cordis `ctx.emit/on` + `ctx.remote.$on`（仅 allowlist 宿主事件）。

| 岛元素 | 真实数据源 | 方式 |
|---|---|---|
| 情绪判定（thinking/working/…） | 快照 `running`、`runningCalls`、`pending`、`turnEnds` + chat 节点 `location.turn.end.data.reason` | root 作用域经 `ctx.sessions.currentProvideInfo` 取当前会话后自行绑定快照/投影 |
| 收尾情绪（complete/alert/blocked/max-tokens） | chat 节点 `location.turn.end`（完整 `SessionEvent<'turn/end'>`，含 `data.reason.kind`） | live-bridge `lastTurnEndReasonOf()` 取最近 seq 的 reason |
| 流式预览行 | 快照 `partial`（PartialAssistant 正文）+ `runningCalls` | 原始 `assistant/chunk` 不进 ctx.remote，只能走快照 |
| 工具命令卡 | 快照 `runningCalls`（运行中，无参数/退出码）+ 会话事件 `tool/call\|result`（完整时间线） | 事件需自行订阅会话 log |
| Todo 清单点 + 三态清单 | 投影 `todos`（`TodoItem[] \| null`） | `todo/write` 整表快照的投影 |
| 目标进度环 | 投影 `goal`（`GoalProjection \| null`：`roundsStarted` / `goal.maxGoalRounds` / `goal.objective`） | goal 包投影 |
| 结果小票 | 投影 `tokenUsage`（`uncachedInput/output/cacheRead/cacheWrite`）+ 快照 `turnTimings`（起止差） | files/checks 无投影源（TODO：从 chat 节点 deliverables 派生） |
| 上下文用量 | 投影 `contextPressure` | 已存在的投影键（ContextMeter 同源） |
| 审批行 | 快照 `pending` 中 `kind==='approval'` 的交互（`payload.toolName/reason`） | 回执走 `pendingItem.respond({approvalId, outcome})`（allowed-once / rejected） |
| 后台任务胶囊 | `session/jobs` 帧 → sessions 列表的 `jobsBySession` 镜像（JobView） | live-bridge 已接（骑 `ctx.sessions.list`，root 作用域可读） |
| 停止 / 取消 | 会话行为动词 `session.cancel()` | `SessionFace` 自带（`runtime/src/client/contract/session.ts`） |
| 重试 / 继续 | `session.prompt([{type:'text',text}], 'queue' \| 'steer')` | 同 `SessionFace`（live-bridge 待接，正文取 queue 最近用户消息） |
| 解除阻塞 | `ctx.remote.goals.resume(sessionId, {id, revision})` | ui-goal 同款 CAS 远端（live-bridge 已接） |

**关键约束**：`shell.overlay` 是 root 作用域，拿不到框架注入的 `sessionId`/`useSession`
标准件 —— 需要自己用全局座的 `useSessions` 找到当前会话，再经
`ctx.sessions.binding(id).session.projections.faceOf(key)` 订阅投影，或用 uSES 桥
（`web-react` 的 `bindSnapshotSelector`）绑定快照。还要自洽处理「无会话 / 多会话」。

## 四、插件包解剖（本仓库根就是双面包插件包）

仓库根即插件包：`dsh plugin --profile web add <本仓库根>` 直接可装。
浏览器半场构建产物 `lib/client.js` 由 `npm run build:plugin` 产出，
形状与仓库内客户端插件一致（`__ModuleLoader__.load` 闭包工厂 + 平台模块表 extern）。

```
（仓库根）
├── package.json          # name: dsh-dynamic-island
│                         #   dsh.bundle.patch → ./cordis.patch.yml
│                         #   dsh.client { platform:'web', inject:[runtime, locale, ui-slots, web-react] }
│                         #   exports["./client"] → lib/client.js（浏览器半场）
├── cordis.patch.yml      # - insert: [{ id: ui-dynamic-island, name: 'dsh-dynamic-island' }]
├── scripts/build-plugin.mjs  # Vite lib（cjs）+ 闭包工厂包装；extern = 平台模块表 10 词
├── lib/client.js         # 构建产物（gitignore）
└── src/
    ├── index.js          # node 半场：空 apply(){} —— 让包成为 loader entry
    ├── client/           # 浏览器半场（直接复用 src/components 与 src/plugin）
    │   ├── index.js      # apply(ctx)：注入样式 + locale + shell.overlay 注册
    │   ├── IslandDock.jsx# 浮层容器：useStore → live 驱动 → CompanionContext → <Island/>
    │   ├── island-store.js   # register 的 store 座位（spec.init/actions）
    │   ├── live-bridge.js    # ctx.sessions → 快照+投影 → deriveMood → store（含真实动作面）
    │   ├── styles.js / island-plugin.css  # CSS ?inline 内联 + <style data-plugin> 注入
    │   └── locales.js    # 字典（zh/en）
    ├── plugin/protocol.js# 协议适配层：DSH 状态 → 岛模型（纯映射，可独立测试）
    ├── components/island/*  # 岛 UI（demo 与插件共用同一套组件）
    └── App.jsx           # 设计原型（演示/开发游乐场，不属于插件产物）
```

## 五、安装与运行

```sh
# 0) 构建浏览器半场（产物 lib/client.js）
npm install && npm run build:plugin

# 1) 从本仓库根直接装（e2e 已验证的路径）
dsh plugin --profile web add /path/to/dsh-companion-concept

# 2) 或发布为 npm 包后
dsh plugin --profile web add dsh-dynamic-island

# 3) 或不动 profile，只在自己的 patch 层加一行（等价于 bundle 的 insert）
#   ~/.dsh/profiles/web/cordis.patch.yml:
#   - insert:
#       - id: ui-dynamic-island
#         name: 'dsh-dynamic-island'
```

装完**重启** `dsh --profile web`（modules node 半场的包元数据缓存不失效，
插件集变更必须重启），打开 Web GUI —— 岛出现在工作区右上角的浮层里。
安装后可用 `dsh --profile web --dump-config | grep dynamic-island` 验证行已入树。

## 六、开发工作流

- **首选（本仓库已支持）**：`npm run build:plugin` 用自有 Vite 配方产出合规 bundle
  （闭包工厂 + 平台模块表 extern + CSS `?inline` 内联注入），无需仓库内工具链。
- **进仓库联调（可选）**：把 `src/client/` 迁为
  `deepseek-harness/packages/client/ui-island/`（对齐 ui-goal/ui-jobs 的包结构），
  可直接复用 `packages/client/tsdown.client.ts` 构建配方与
  `pnpm run dev:web` 的客户端插件 HMR 链，测试用 `dsh-client-test-runtime`。
- 本地验证（无需 GUI）：`node` 冒烟脚本已覆盖 —— 加载 `lib/client.js`、
  断言 `__ModuleLoader__.load` 握手、执行工厂、用桩 ctx 跑 `apply()`、
  用带数据的 `sessions` 桩验证桥派生与动作面。

## 七、已知缺口与阻塞（诚实清单）

1. **pre-release，无对外 SDK**：`@deepseek-ai/*` 与 vendored `@deepseek-ai/cordis`
   都是仓库内 workspace 包，没有版本承诺；第三方插件要 peer 依赖内部 API。
2. **浏览器内联调未做**：桥的订阅路径（`currentProvideInfo` → 快照/投影）已按源码
   契约实现并经桩测试，但还没有在真实 GUI 里跑过 —— 首次联调需在仓库内
   （或装上插件后）核对 `info.hooks['session']` / `projections.faceOf` 的实机行为。
3. **动作面部分待接**：`stop → session.cancel()` 已接；retry/continue/unblock/approve
   需要按 docs 第三节的远端（`session.prompt` / `ctx.remote.goals.resume` / 审批 Remote）
   在仓库内确认签名后接入。
4. **插槽契约**：`SlotMap` 是 TS 声明合并，第三方可注册**已有**插槽（shell.overlay
   恰好是现成的）；但「声明全新 UI 座位」还没有跨仓库的对外契约。
5. **动态加载需审批**：`cordis-host-runner` 支持运行时加载带 client 半边的插件，
   但走审批门（client-pending 状态），且不落盘、重启即失。
6. **快照粒度**：原始 `assistant/chunk` 流不进 ctx.remote，实时打字机/todo 只能走
   rAF 批处理的快照 selector —— 岛的过程面板时间线需要自行订阅会话 log 事件。

## 八、本仓库落地进度与下一步

| 里程碑 | 状态 |
|---|---|
| 调研与集成方案（本文） | ✅ |
| 协议适配层 `src/plugin/protocol.js`（DSH 状态 → 岛模型） | ✅ |
| 仓库根改造为双面包插件包（package.json / cordis.patch.yml / node+浏览器半场 / locales / store / 实时桥） | ✅ |
| `npm run build:plugin` 产出合规 bundle（闭包工厂 + 平台表 extern） | ✅ |
| bundle 冒烟（握手 / 工厂 / apply / 桥派生 / 动作面） | ✅（桩测试通过） |
| 岛 UI 复用：src/components 直接作为插件组件树（无需移植） | ✅ |
| 真实 GUI 内联调（桥订阅实机核对 + 动作面接远端） | ⏳ 需装上插件后验证 |
| 发布 npm 包 + `dsh plugin add` 安装说明 | ⏳ 依赖联调 |

> 下一步建议（按顺序）：① 按第五节 `dsh plugin --profile web add <本仓库>`
> 装进本地 GUI，核对桥的实机行为（无会话/有会话/多会话）；② 接上
> retry/continue/unblock/approve 的真实远端；③ 需要 HMR 开发链时再迁进
> deepseek-harness 仓库作为 workspace 包。上游一旦把「客户端构建指南 / 插件 SDK」
> 做成正式接口，本仓库的 `build:plugin` 配方可直接换成官方配方。

---

## 八·五、镜像原则（不改变 Harness 原生交互）

岛的一切操作都是**原生面的镜像入口**，绝不动 Harness 原有的交互：

- **审批**：与原生 composer 的 ApprovalPanel 共用同一个 `PendingWait` 实例与
  `.respond()` 回执通道——谁先回执谁结算（settled 守卫对重复回执同步抛错，
  岛已 try/catch 兜住并如实提示「已在原生面处理」），原生输入栏不受任何影响。
- **停止/取消**：调用与原生停止按钮同一个 `session.cancel()`。
- **解除阻塞**：调用与 ui-goal 同一个 `ctx.remote.goals.resume` CAS 远端。
- **槽位**：岛只注册 `shell.overlay`（root 浮层），不触碰任何 composer /
  input / header 原生槽位。
- **全局监听**：岛不添加全局键盘监听；拖拽后仅以 capture-once 抑制「落在岛
  表面内」的 click（`elRef.contains(target)` 校验），原生元素的点击绝不拦截。
- **事件面**：岛只读快照/投影（HostObservable 只读），不修改任何会话状态。

## 九、对齐审计表（逐功能 × DSH 信号，2026-08 核实）

> ✅ = 信号存在、代码已按真实形状接入并经桩测试；⚠️ = 信号存在但尚未接入/需实机核对；
> ❌ = 当前无可用信号或依赖未验证的假设。审计依据全部来自 Harness 源码
> （`client/runtime` 快照契约、`llm/token-meter`、`todo/tool-todo`、`goal/goal`、
> `interaction/permission-presets`、`session/session-stats` 等投影声明）。

| 岛功能 | DSH 真实信号 | 状态 | 说明 |
|---|---|---|---|
| idle 待命 | 快照 `running=false` + 无闭合回合 | ✅ | 无会话/空闲均落 idle |
| thinking / working | 快照 `running` + `runningCalls` | ✅ | working 需 `runningCalls.length>0` |
| approval 情绪 | 快照 `pending.some(kind==='approval')` | ✅ | 已修正（此前误用 permissions 预设） |
| 审批行文案 | `pending[].payload.toolName/reason` | ✅ | ApprovalRow 已接 |
| 批准 / 拒绝 | `pendingItem.respond({approvalId, outcome})` | ✅ | outcome: allowed-once / rejected（已核实帧形状） |
| complete / alert / blocked / max-tokens | chat 节点 `location.turn.end.data.reason.kind` | ✅ | `lastTurnEndReasonOf()` 已接 |
| 流式预览 | 快照 `partial.text` | ✅（粒度受限） | 原始 chunk 流不进 ctx.remote，rAF 批处理 |
| 工具卡（运行中） | 快照 `runningCalls`（name 仅此） | ⚠️ | 无参数/退出码；历史 tool/result 需订阅会话 log |
| 过程时间线 | 会话 log 事件（`tool/call`/`tool/result`/`step/*`） | ⚠️ | 客户端会话事件源已核实，live-bridge 未订阅 |
| todo 清单 | 投影 `todos`（`TodoItem[] \| null`） | ✅ | 字段/三态与投影一致 |
| 目标环 | 投影 `goal`：`roundsStarted` / `goal.maxGoalRounds` / `goal.objective` | ✅ | 已修正字段名（此前用 roundCap） |
| blocked 额外依据 | `goal.goal.phase === 'blocked'` | ✅ | 模型已带 `goal.blocked` |
| 结果小票 tokens | 投影 `tokenUsage`（uncachedInput/output/cacheRead/cacheWrite） | ✅ | 已修正字段名（此前用 inputTokens/reasoning） |
| 结果小票时长 | 快照 `turnTimings` 最近回合起止差 | ✅ | 兜底 sessionStats.llmMs+toolMs |
| 结果小票 files/checks | 无投影 | ❌ | TODO：从 chat 节点 deliverables 派生 |
| 后台任务胶囊 | `session/jobs` 帧 → sessions 列表 `jobsBySession` 镜像（JobView） | ✅（待实机） | 已接：live-bridge 读 `ctx.sessions.list` 镜像，协议层映射 label/status/detail/耗时 |
| 模型徽章 | `modelDirectories` 服务（ui-model-selection）的 per-session 目录 store：`ModelSelection {provider, model}` | ✅（待实机） | 已接：live-bridge 订阅目录 store，徽章显示 provider · model |
| 最近完成小票堆 | turn/end 序列 | ⚠️ | chat 节点可遍历历史回合，live-bridge 未实现 |
| 上下文用量 | 投影 `contextPressure` | ✅ | 已有投影键，岛尚未展示该条 |
| 停止 / 取消 | `session.cancel()` | ✅ | 已接 |
| 解除阻塞 | `ctx.remote.goals.resume(sessionId, ref)` | ✅ | 已接（CAS ref 取自 goal 投影） |
| 重试 / 继续 | `session.prompt(content, 'queue'\|'steer')` | ⚠️ | 动词已核实；正文需取 queue 最近用户消息 |
| 折叠/展开/过程/清单 | 本地 UI 状态 | ✅ | 与 DSH 无关 |
| 无会话 / 多会话 | `currentProvideInfo` 跟随当前选择 | ✅（待实机） | 逻辑已按契约实现，未在真实 GUI 跑过 |

**结论（对齐状态小结）**：
- **展示侧 ≈ 90% 对齐（桩测试层面）**，**动作侧约 70%**（5 个动词里
  cancel / respondApproval / unblock 已接真实动词；retry / continue 待接）。
- 剩余缺口（jobs 镜像与模型徽章已在本轮接上）：
  ① files/checks 小票（需从 chat 节点 deliverables 派生）
  ② 过程时间线（订阅会话 log 事件）③ retry/continue（`session.prompt` 正文取
  queue 最近用户消息）。
- **最后一道验证是真实 GUI 内联调**：桩测试不能替代实机核对
  `currentProvideInfo` / 快照 / 投影在浏览器里的实际行为。装上插件
  （`dsh plugin --profile web add dsh-dynamic-island`）跑一次，就能把上表
  标「✅（待实机）」的项全部落实，同时按上述优先级补齐剩余缺口。
