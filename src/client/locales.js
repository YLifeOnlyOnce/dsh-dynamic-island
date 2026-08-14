/**
 * 灵动岛文案字典（zh / en）。
 * 岛内面板文案（查看过程 / 清单 / 批准 / 暂不 / 停止 / 重试…）仍由
 * src/components 自带（原型中文文案）；本字典覆盖浮层容器与状态文案。
 */
export const NS = 'island'

export const zh = {
  dock: {
    aria: 'Companion 灵动岛',
    ready: '随时吩咐',
    running: '运行中',
  },
  mood: {
    idle: '待命',
    thinking: '思考',
    working: '执行',
    approval: '确认',
    complete: '完成',
    alert: '异常',
    blocked: '阻塞',
    'max-tokens': '上限',
  },
}

export const en = {
  dock: {
    aria: 'Companion dynamic island',
    ready: 'Ready when you are',
    running: 'Running',
  },
  mood: {
    idle: 'Idle',
    thinking: 'Thinking',
    working: 'Working',
    approval: 'Approval',
    complete: 'Complete',
    alert: 'Alert',
    blocked: 'Blocked',
    'max-tokens': 'Max tokens',
  },
}
