/**
 * 八种情绪的演示数据。
 *
 * 每个 mood 都对应一条真实 Harness 信号（见 docs/analysis.md 第四节）：
 *   idle       ← agent/status: idle
 *   thinking   ← agent/status: running + step/start + assistant/chunk(reasoning-delta)
 *   working    ← tool/call → tool/result
 *   approval   ← composer 挂起审批
 *   complete   ← turn/end{completed} + usage
 *   alert      ← tool/result.error / agent/request-error / turn/end{error}
 *   blocked    ← turn/end{blocked}
 *   max-tokens ← turn/end{max-tokens}
 *
 * 载荷字段：
 *   goal       ← goal 包（roundsStarted / 轮次上限）
 *   todo/todos ← todo/write 整表快照
 *   jobs       ← jobs 包（running|stopping|completed|killed|failed + detail）
 *   receipt    ← turn/end.reason + assistant/message.usage
 *   recent     ← turn/end 序列（最近完成）
 *   model      ← request/context（provider · model）
 *   stream     ← assistant/chunk（流式预览脚本文本）
 *   feed       ← 过程活动流（step / tool / todo / text / system / receipt）
 */

export const TODO_ITEMS = [
  '梳理登录页响应式问题',
  '检查移动端断点',
  '安装响应式依赖',
  '调整 grid 与 input 布局',
  '验证 4 个断点',
  '收尾提交',
]

export const moods = {
  idle: {
    label: '待命',
    eyebrow: '待命中',
    title: '没有进行中的任务',
    detail: 'agent/status: idle · 随时吩咐',
    step: '—',
    progress: 0,
    tone: 'slate',
    model: 'deepseek · v3.2',
    feed: [
      { kind: 'system', text: '会话已就绪 · agent/status: idle' },
      { kind: 'text', text: '随时可以开始一个新任务', tone: 'answer' },
    ],
  },
  thinking: {
    label: '思考',
    eyebrow: '正在规划',
    title: '梳理登录页的响应式问题',
    step: '02 / 06',
    progress: 32,
    tone: 'aqua',
    model: 'deepseek · r1-0528',
    goal: { done: 1, total: 5, title: '登录页移动端适配' },
    todo: { done: 1, total: 6, current: '梳理登录页响应式问题' },
    todos: TODO_ITEMS,
    stream: [
      '登录表单在 <640px 下溢出，',
      '问题集中在 grid 列与 input 的 min-width。',
      '先核对组件结构与已有样式…',
    ],
    feed: [
      { kind: 'step', text: '第 1 步 · 读取项目规范' },
      { kind: 'todo', text: '「梳理登录页响应式问题」进行中', status: 'active' },
      { kind: 'text', text: '登录表单在 <640px 下溢出，问题集中在 grid 列与 input 的 min-width。', tone: 'reasoning' },
    ],
  },
  working: {
    label: '执行',
    eyebrow: '正在执行',
    title: '检查移动端断点',
    step: '03 / 06',
    progress: 51,
    tone: 'mint',
    model: 'deepseek · v3.2',
    goal: { done: 2, total: 5, title: '登录页移动端适配' },
    todo: { done: 2, total: 6, current: '检查移动端断点' },
    todos: TODO_ITEMS,
    jobs: [{ name: 'npm run build', status: 'running', elapsed: '01:12' }],
    stream: ['命中 3 处断点：sm / md / lg 各一处，', '接下来读取 LoginForm.tsx 确认结构。'],
    feed: [
      { kind: 'tool', name: 'bash', args: 'rg "@media|sm:|md:" src/components', exit: 0, duration: '412ms' },
      { kind: 'todo', text: '「检查移动端断点」完成', status: 'done' },
      { kind: 'text', text: '命中 3 处断点：sm / md / lg 各一处', tone: 'answer' },
      { kind: 'tool', name: 'read', args: 'src/components/LoginForm.tsx', exit: 0, duration: '96ms' },
      { kind: 'system', text: '已派生子代理 · 并行扫描测试目录（subagent/start）' },
    ],
  },
  approval: {
    label: '确认',
    eyebrow: '需要你的确认',
    title: '准备安装一个开发依赖',
    detail: 'pnpm add -D @tailwindcss/container-queries',
    step: '下一步',
    progress: 66,
    tone: 'coral',
    model: 'deepseek · v3.2',
    goal: { done: 2, total: 5, title: '登录页移动端适配' },
    todo: { done: 3, total: 6, current: '安装响应式依赖' },
    todos: TODO_ITEMS,
    feed: [
      { kind: 'tool', name: 'bash', args: 'pnpm add -D @tailwindcss/container-queries', exit: null, duration: '—' },
      { kind: 'text', text: '新的响应式方案需要容器查询插件', tone: 'answer' },
      { kind: 'system', text: '等待你的确认 · 与原生输入栏同步' },
    ],
  },
  complete: {
    label: '完成',
    eyebrow: '任务已完成',
    title: '登录页已经适配移动端',
    detail: '修改 3 个文件 · 验证了 4 个断点',
    step: '03:18',
    progress: 100,
    tone: 'lime',
    model: 'deepseek · v3.2',
    goal: { done: 5, total: 5, title: '登录页移动端适配' },
    todo: { done: 6, total: 6, current: '' },
    todos: TODO_ITEMS,
    receipt: {
      files: 3,
      checks: 4,
      duration: '03:18',
      tokens: { output: 2216, cache: 9200, reasoning: 1180 },
    },
    recent: [
      { title: '修复侧边栏折叠', duration: '02:11', files: 2 },
      { title: '补全双语 README', duration: '04:37', files: 1 },
    ],
    feed: [
      { kind: 'todo', text: '「验证 4 个断点」完成', status: 'done' },
      { kind: 'tool', name: 'write', args: 'src/components/LoginForm.tsx', exit: 0, duration: '320ms' },
      { kind: 'text', text: '4 个断点在浏览器与测试中全部通过', tone: 'answer' },
      { kind: 'step', text: '第 6 步 · 收尾提交' },
      { kind: 'receipt', text: '3 个文件 · 4 项检查 · 2.2k 输出 tokens · 1.2k 缓存命中' },
    ],
  },
  alert: {
    label: '异常',
    eyebrow: '需要查看',
    title: '本地预览没有正常启动',
    detail: '端口 5173 已被占用，等待你的处理',
    step: '已暂停',
    progress: 51,
    tone: 'amber',
    model: 'deepseek · v3.2',
    goal: { done: 2, total: 5, title: '登录页移动端适配' },
    todo: { done: 3, total: 6, current: '本地预览' },
    todos: TODO_ITEMS,
    jobs: [{ name: 'npm run dev', status: 'failed', detail: 'exit code 1' }],
    feed: [
      { kind: 'tool', name: 'bash', args: 'npm run dev', exit: 1, duration: '88ms' },
      { kind: 'text', text: '端口 5173 已被占用，进程退出', tone: 'answer' },
      { kind: 'system', text: 'agent/request-error · 已暂停，等待处理' },
    ],
  },
  blocked: {
    label: '阻塞',
    eyebrow: '需要解除阻塞',
    title: '目标推进被阻塞',
    detail: 'turn/end {blocked} · 需要你的干预',
    step: '已暂停',
    progress: 66,
    tone: 'violet',
    model: 'deepseek · r1-0528',
    goal: { done: 2, total: 5, title: '登录页移动端适配' },
    todo: { done: 3, total: 6, current: '安装响应式依赖' },
    todos: TODO_ITEMS,
    feed: [
      { kind: 'system', text: 'turn/end {blocked} · 目标已暂停' },
      { kind: 'system', text: '同一阻塞持续多轮 · goal 不再自动续跑' },
      { kind: 'text', text: '建议：调整目标描述，或手动介入后让 agent 继续推进', tone: 'answer' },
    ],
  },
  'max-tokens': {
    label: '上限',
    eyebrow: '输出已达上限',
    title: '回合被截断',
    detail: 'turn/end {max-tokens} · 结果可能不完整',
    step: '05 / 06',
    progress: 84,
    tone: 'rose',
    model: 'deepseek · v3.2',
    goal: { done: 4, total: 5, title: '登录页移动端适配' },
    todo: { done: 4, total: 6, current: '调整 grid 与 input 布局' },
    todos: TODO_ITEMS,
    feed: [
      { kind: 'system', text: 'turn/end {max-tokens} · 输出达到上限' },
      { kind: 'text', text: '第 5 步的回复被截断，可要求 agent 继续当前回合', tone: 'answer' },
    ],
  },
}

/** 自动演示的脚本化时间线（原型专属，非真实信号）。 */
export const DEMO_TIMELINE = [
  { key: 'idle', dur: 1800 },
  { key: 'thinking', dur: 2400 },
  { key: 'working', dur: 2800 },
  { key: 'approval', dur: 3400 },
  { key: 'complete', dur: 3400 },
]
