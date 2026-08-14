/**
 * 协议适配层 —— DSH 客户端状态 → 岛模型的纯映射（可独立测试）。
 *
 * 这是 README 所承诺的「窄的、可版本化的客户端状态协议」的落地：
 * 岛不直吞原始事件流，而是消费 Web GUI 框架已经组装好的实时状态，
 * 再派生成本仓库 data/moods.js 同构的岛模型（八态 + 载荷字段）。
 *
 * 输入（全部来自 DSH Web GUI 客户端框架，见 docs/integration.md 第二节）：
 *   - snapshot      ← useSession() 的 ConversationSnapshot 关键字段：
 *                     running / partial / runningCalls / turnEnds / queue / pending
 *   - projections   ← useProjection(key)：
 *                     goal / todos / tokenUsage / sessionStats / contextPressure / permissions
 *   - agentStatus   ← agent/status 实时事件（可选，缺省用 snapshot.running）
 *   - model         ← request/context（provider · model，可选）
 *
 * 输出：{ mood, eyebrow, title, step, progress, model, goal, todo, todos,
 *         jobs, receipt, stream, feed } —— 与 data/moods.js 完全同构。
 */

/** turn/end.reason 到岛情绪的映射。 */
export const TURN_END_MOOD = {
  completed: 'complete',
  error: 'alert',
  blocked: 'blocked',
  'max-tokens': 'max-tokens',
  aborted: 'alert',
  interrupted: 'alert',
}

/**
 * 会话是否已有闭合回合（turnEnds 非空）。
 * 注意：turn/end 的 reason 不在 ConversationSnapshot 里（快照只有
 * turn 号 → 事件 seq 的映射），需要调用方从会话事件订阅里解析后经
 * `lastReason` 传入 —— 这也是协议层要求「快照 + 事件」双通道的原因。
 */
export function hasTurnEnd(turnEnds) {
  return turnEnds != null && turnEnds.size > 0
}

/** 步骤计数 → 展示文案，如 { turn: 2, step: 3, total: 6 } → '步骤 03 / 06'。 */
export function stepLabel({ turn, step, total }) {
  if (turn == null) return '—'
  const s = String(step ?? 1).padStart(2, '0')
  const t = String(total ?? turn).padStart(2, '0')
  return `步骤 ${s} / ${t}`
}

/** token 数 → 紧凑文案：2216 → '2.2k'。 */
export function fmtTokens(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

/**
 * 派生岛模型。全部字段为可选，缺省即隐藏对应岛内元素 —— 派生结果
 * 与 demo 数据（data/moods.js）同构，可用同一套 React 组件渲染。
 *
 * @param {object} input
 * @param {object} [input.snapshot]      useSession() 快照（ConversationSnapshot 子集）
 * @param {object} [input.projections]   useProjection() 各键的当前值
 * @param {string} [input.model]         provider · model 文案
 * @param {string} [input.lastReason]    最近一个 turn/end 的 reason（由事件订阅解析）
 * @returns {object} 岛模型
 */
export function deriveMood({
  snapshot = {},
  projections = {},
  model,
  lastReason,
  ignoreApproval = false,
} = {}) {
  const {
    running = false,
    partial = null,
    runningCalls = [],
    pending = [],
    turnEnds,
    turnTimings,
  } = snapshot
  const {
    goal,
    todos,
    tokenUsage,
    sessionStats,
    contextPressure,
  } = projections

  // ── 审批：快照 pending 里有 kind === 'approval' 的挂起交互（真实信号）──
  // ignoreApproval=true（插件模式）时不渲染审批面 —— 审批完全交给原生输入栏。
  const approvalPending = !ignoreApproval
    && Array.isArray(pending)
    && pending.some(p => p && p.kind === 'approval')
  const approvalItem = approvalPending && Array.isArray(pending)
    ? pending.find(p => p && p.kind === 'approval')
    : undefined

  // ── 情绪判定（顺序即优先级）──
  let mood
  if (approvalPending) mood = 'approval'
  else if (running && runningCalls.length > 0) mood = 'working'
  else if (running) mood = 'thinking'
  else if (hasTurnEnd(turnEnds)) mood = TURN_END_MOOD[lastReason] ?? 'complete'
  else mood = 'idle'

  // ── 步骤 / 进度（sessionStats 是整表计数：回合数 / 步数）──
  const step = stepLabel({ turn: sessionStats?.turns, step: sessionStats?.steps })
  const progress = todoProgress(projections)

  // ── 结果小票（completed 时；字段全部对照真实投影形状）──
  //   duration ← 快照 turnTimings 最近闭合回合的起止差；
  //   tokens ← tokenUsage（uncachedInput/output/cacheRead/cacheWrite）；
  //   files/checks 无投影源（TODO：从会话 chat 节点的 deliverables 派生）。
  const receipt = mood === 'complete'
    ? {
        files: undefined,
        checks: undefined,
        duration: durationLabel(turnTimings) ?? fmtDuration(sessionStats),
        tokens: {
          input: tokenUsage?.uncachedInputTokens ?? 0,
          output: tokenUsage?.outputTokens ?? 0,
          cache: tokenUsage?.cacheReadTokens ?? 0,
          write: tokenUsage?.cacheWriteTokens ?? 0,
        },
      }
    : undefined

  // ── 活动行（detail）：只放真实内容 —— partial 的正文/推理，无则隐藏 ──
  const detail = partialText(partial)

  // ── 过程活动流（live 只放真实可见内容；空则收起）──
  //   运行中的工具以文本行呈现，带上真实参数预览（argsRaw）：
  //   如 `bash · rg "@media" src/components`、`edit · src/App.jsx`。
  const feed = (running && runningCalls.length > 0)
    ? runningCalls.map(call => ({
        kind: 'text',
        text: [call.name ?? '工具', argsPreview(call)].filter(Boolean).join(' · '),
        tone: 'answer',
      }))
    : []

  return {
    mood,
    label: MOOD_LABEL[mood],
    tone: MOOD_TONE[mood],
    eyebrow: MOOD_META[mood].eyebrow,
    title: titleOf(mood, projections, { running, runningCalls, partial }),
    detail,
    step,
    progress,
    running,
    model,
    goal: goal
      ? {
          done: goal.roundsStarted ?? 0,
          total: goal.goal?.maxGoalRounds ?? 0,
          title: goal.goal?.objective ?? '目标',
          blocked: goal.goal?.phase === 'blocked',
        }
      : undefined,
    todo: todoSummary(todos),
    todos: todos?.map(t => t.content) ?? undefined,
    receipt,
    jobs: undefined, // 后台任务已在 0.3.0 从岛 UI 移除（数据面保留备用）
    feed,
    approval: approvalItem
      ? { toolName: approvalItem.payload?.toolName, reason: approvalItem.payload?.reason }
      : undefined,
    contextPressure,
  }
}

/** 最近闭合回合的起止差 → 人类可读时长；无则 undefined。 */
function durationLabel(turnTimings) {
  if (!turnTimings) return undefined
  let last = null
  for (const [, timing] of turnTimings) {
    if (timing?.endTime != null && (last === null || timing.endTime > last.endTime)) last = timing
  }
  if (!last) return undefined
  const s = Math.max(1, Math.round((last.endTime - last.startTime) / 1000))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** sessionStats 整表耗时的兜底格式。 */
function fmtDuration(sessionStats) {
  if (!sessionStats?.llmMs && !sessionStats?.toolMs) return undefined
  const s = Math.max(1, Math.round((sessionStats.llmMs + sessionStats.toolMs) / 1000))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** 各情绪的基础文案（与 data/moods.js 对齐）。 */
export const MOOD_META = {
  idle: { eyebrow: '待命中' },
  thinking: { eyebrow: '正在规划' },
  working: { eyebrow: '正在执行' },
  approval: { eyebrow: '需要你的确认' },
  complete: { eyebrow: '任务已完成' },
  alert: { eyebrow: '需要查看' },
  blocked: { eyebrow: '需要解除阻塞' },
  'max-tokens': { eyebrow: '输出已达上限' },
}

/** 情绪 → 展示标签（演示坞/可访问名）。 */
export const MOOD_LABEL = {
  idle: '待命',
  thinking: '思考',
  working: '执行',
  approval: '确认',
  complete: '完成',
  alert: '异常',
  blocked: '阻塞',
  'max-tokens': '上限',
}

/** 情绪 → 岛色调（与 data/moods.js 的 tone 一致）。 */
export const MOOD_TONE = {
  idle: 'slate',
  thinking: 'aqua',
  working: 'mint',
  approval: 'coral',
  complete: 'lime',
  alert: 'amber',
  blocked: 'violet',
  'max-tokens': 'rose',
}

/** 工具名 → 动词短语（live 标题用，避免全显示「思考下一步」）。 */
const TOOL_LABEL = {
  bash: '执行命令',
  pwsh: '执行命令',
  shell: '执行命令',
  read: '读取文件',
  'fs-read': '读取文件',
  write: '写入文件',
  'fs-write': '写入文件',
  edit: '编辑文件',
  'str-replace-editor': '编辑文件',
  grep: '搜索代码',
  rg: '搜索代码',
  glob: '搜索文件',
}

/** 运行中的工具 → 标题，如「正在执行命令 · bash」。 */
function toolTitle(call) {
  const verb = TOOL_LABEL[call.name] ?? '执行工具'
  return `正在${verb} · ${call.name}`
}

/** partial 的正文/推理文本（blocks 结构）；无则 undefined。 */
function partialText(partial) {
  const blocks = partial?.blocks
  if (!Array.isArray(blocks) || blocks.length === 0) return undefined
  const text = blocks.filter(b => b?.kind === 'text').map(b => b.text).join('').trim()
  if (text) return text
  const reasoning = blocks.filter(b => b?.kind === 'reasoning').map(b => b.text).join('').trim()
  return reasoning || undefined
}

/** 工具参数预览：argsRaw 解析出 command/filePath/path，否则截断原文。 */
function argsPreview(call) {
  const raw = call?.argsRaw
  if (!raw || typeof raw !== 'string') return undefined
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      const pick = parsed.command ?? parsed.filePath ?? parsed.path ?? parsed.arguments
      if (typeof pick === 'string' && pick) return pick
    }
  } catch {
    /* 非 JSON 参数原文，走截断 */
  }
  const s = raw.trim()
  return s.length > 48 ? s.slice(0, 48) + '…' : s || undefined
}

/** 标题：目标 → 进行中任务 → 运行工具 → 准备调用 → 情绪默认。 */
function titleOf(mood, { goal, todos } = {}, { running, runningCalls, partial } = {}) {
  if (mood === 'approval') return '等待你的确认'
  if (goal?.objective) return goal.objective
  const active = todos?.find(t => t.status === 'in_progress')
  if (active?.content) return active.content
  if (mood === 'working' && runningCalls?.length > 0) return toolTitle(runningCalls[0])
  if (mood === 'thinking' && running) {
    // 模型已决定调用工具（partial 含 tool-call 块）但尚未进入运行 → 准备调用
    const pendingTool = partial?.blocks?.find(b => b?.kind === 'tool-call')
    if (pendingTool?.name) return `准备调用 · ${pendingTool.name}`
  }
  return MOOD_TITLE[mood]
}

const MOOD_TITLE = {
  idle: '没有进行中的任务',
  thinking: '正在思考下一步',
  working: '正在执行工具调用',
  approval: '需要你的确认',
  complete: '任务已完成',
  alert: '需要查看',
  blocked: '目标推进被阻塞',
  'max-tokens': '回合被截断',
}

/** todo 整表快照 → 清单点字段。 */
function todoSummary(todos) {
  if (!Array.isArray(todos) || todos.length === 0) return undefined
  const done = todos.filter(t => t.status === 'completed').length
  const current = todos.find(t => t.status === 'in_progress')
  return {
    done,
    total: todos.length,
    current: current?.content ?? '',
  }
}

/** 进度百分比：有 todo 用 done/total，否则 0。 */
function todoProgress({ todos } = {}) {
  if (!Array.isArray(todos) || todos.length === 0) return 0
  const done = todos.filter(t => t.status === 'completed').length
  return Math.round((done / todos.length) * 100)
}
