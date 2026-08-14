import { deriveMood } from '../plugin/protocol.js'

/**
 * 实时桥 —— 把 DSH 客户端会话状态喂进岛 store。
 *
 * 数据源（全部对照源码核实，见 docs/integration.md 第三节与审计表）：
 *   - ctx.sessions.currentProvideInfo —— HostObservable<SessionMaybeProvideInfo>，
 *     跟随当前会话：{ sessionId, hooks: { session: 快照源 }, projections.faceOf(key) }；
 *   - info.hooks['session'] —— ConversationSnapshot 的 HostObservable；
 *   - info.projections.faceOf(key) —— goal / todos / tokenUsage / sessionStats /
 *     contextPressure / permissions 各投影的 HostObservable；
 *   - 快照内 chat 节点的 location.turn.end —— 完整 SessionEvent<'turn/end'>，
 *     由此解析最近一次 reason（complete/alert/blocked/max-tokens 的情绪依据）。
 *
 * HostObservable 是 uSES 形状：{ getSnapshot(), subscribe(fn) }。
 */
const PROJECTION_KEYS = [
  'goal',
  'todos',
  'tokenUsage',
  'sessionStats',
  'contextPressure',
  'permissions',
]

/** 从快照的 chat 节点里取最近一个闭合回合的 turn/end.reason.kind。 */
export function lastTurnEndReasonOf(snapshot) {
  const nodes = snapshot?.chat?.nodes
  if (!nodes || typeof nodes.values !== 'function') return undefined
  let best = undefined
  for (const node of nodes.values()) {
    const end = node?.location?.turn?.end
    const reason = end?.data?.reason?.kind
    if (end && reason && (best === undefined || end.seq > best.seq)) {
      best = { reason, seq: end.seq }
    }
  }
  return best?.reason
}

export function createLiveBridge(ctx, actions) {
  let infoSub
  let nested = []
  let currentInfo

  const readProjections = info => {
    const projections = {}
    for (const key of PROJECTION_KEYS) {
      projections[key] = info?.projections?.faceOf(key)?.getSnapshot?.()
    }
    return projections
  }

  const push = () => {
    const info = ctx.sessions?.currentProvideInfo?.getSnapshot?.()
    if (info !== currentInfo) {
      currentInfo = info
      actions.setSession(info?.sessionId)
      resubscribeNested(info)
    }
    const snapshot = currentInfo?.hooks?.['session']?.getSnapshot?.()
    const model = deriveMood({
      snapshot,
      projections: readProjections(currentInfo),
      lastReason: lastTurnEndReasonOf(snapshot),
      model: currentModelLabel(),
      jobs: currentJobs(),
    })
    actions.setModel(model)
  }

  /** 当前会话的模型徽章：modelDirectories 服务的 per-session 选择。 */
  const currentModelLabel = () => {
    const info = ctx.sessions?.currentProvideInfo?.getSnapshot?.()
    const id = info?.sessionId
    const current = id && ctx.modelDirectories?.directoryFor?.(id)?.store?.getSnapshot?.()?.current
    return current?.provider && current?.model ? `${current.provider} · ${current.model}` : undefined
  }

  /** 当前会话的后台任务：session/jobs 帧的 jobsBySession 镜像（骑在 sessions.list 上）。 */
  const currentJobs = () => {
    const info = ctx.sessions?.currentProvideInfo?.getSnapshot?.()
    const id = info?.sessionId
    return id ? ctx.sessions?.list?.getSnapshot?.()?.jobsBySession?.[id] : undefined
  }

  /** 当前会话的 info 变化时，重建对快照、投影、模型目录与 jobs 列表的订阅。 */
  const resubscribeNested = info => {
    for (const off of nested) off()
    nested = []
    const sources = []
    if (info?.hooks?.['session']) sources.push(info.hooks['session'])
    for (const key of PROJECTION_KEYS) {
      const face = info?.projections?.faceOf(key)
      if (face) sources.push(face)
    }
    const dirStore = info?.sessionId && ctx.modelDirectories?.directoryFor?.(info.sessionId)?.store
    if (dirStore?.subscribe) sources.push(dirStore)
    if (ctx.sessions?.list?.subscribe) sources.push(ctx.sessions.list)
    for (const src of sources) nested.push(src.subscribe(push))
  }

  /** 当前会话的工具人：binding / 会话快照。 */
  const current = () => {
    const id = ctx.sessions?.list?.getSnapshot?.()?.current?.id
    const binding = id ? ctx.sessions?.binding?.(id) : undefined
    const info = ctx.sessions?.currentProvideInfo?.getSnapshot?.()
    const snapshot = info?.hooks?.['session']?.getSnapshot?.()
    return { id, binding, snapshot }
  }

  /** 岛动作 → 真实会话行为（镜像入口，结果仍由原生面反馈）。 */
  const verbs = {
    /** 停止/取消 —— SessionFace.cancel()（已核实）。 */
    cancel() {
      const { binding } = current()
      if (!binding?.session?.cancel) return false
      void binding.session.cancel()
      return true
    },
    /**
     * 批准/拒绝审批 —— 快照 pending 里 kind==='approval' 的交互，
     * 用其 respond() 回执（approval/resolved：allowed-once | rejected）。
     */
    respondApproval(outcome) {
      const { snapshot } = current()
      const item = snapshot?.pending?.find(p => p?.kind === 'approval')
      if (!item?.respond) return false
      void item.respond({
        approvalId: item.payload?.approvalId,
        outcome: outcome === true ? 'allowed-once' : 'rejected',
      })
      return true
    },
    /** 解除阻塞 —— ctx.remote.goals.resume(sessionId, ref)（ui-goal 同款 CAS 远端）。 */
    unblock() {
      const { id } = current()
      const info = ctx.sessions?.currentProvideInfo?.getSnapshot?.()
      const goal = info?.projections?.faceOf?.('goal')?.getSnapshot?.()
      const ref = goal?.goal && { id: goal.goal.id, revision: goal.goal.revision }
      if (!id || !ref || !ctx.remote?.goals?.resume) return false
      void ctx.remote.goals.resume(id, ref)
      return true
    },
    // TODO(接真实远端，见 docs/integration.md 第三节动作映射)：
    //   retry / continueTurn —— session.prompt([{type:'text',text}], 'queue' | 'steer')，
    //     正文取快照 queue 里最近一条用户消息。
    retry() {
      return false
    },
    continueTurn() {
      return false
    },
  }

  const start = () => {
    infoSub = ctx.sessions?.currentProvideInfo?.subscribe?.(push)
    push()
  }
  const stop = () => {
    infoSub?.()
    for (const off of nested) off()
    nested = []
  }

  start()
  return { verbs, stop }
}
