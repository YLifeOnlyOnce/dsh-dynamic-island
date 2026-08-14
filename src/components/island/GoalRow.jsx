/**
 * 目标进度环 —— 对应 goal 包（roundsStarted / 轮次上限）。
 * 圆环 + 目标标题 + 轮次计数，颜色跟随 mood 色调。
 */

function GoalRing({ done, total }) {
  const r = 8
  const c = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <svg className="goal-ring" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2.4" />
      <circle
        cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="2.4"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 10 10)"
      />
    </svg>
  )
}

export function GoalRow({ goal, tone }) {
  if (!goal) return null
  return (
    <div className={`goal-row goal-row--${tone}`}>
      <GoalRing done={goal.done} total={goal.total} />
      <span className="goal-title">{goal.title}</span>
      <span className="goal-round">{goal.done} / {goal.total} 轮</span>
    </div>
  )
}
