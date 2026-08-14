/**
 * 后台任务胶囊 —— 对应 jobs 包（running|stopping|completed|killed|failed + detail）。
 * 与 agent 主线并行；失败/完成状态带 detail（如 exit code）。
 */
export function JobChips({ jobs }) {
  if (!jobs || jobs.length === 0) return null
  return (
    <div className="job-chips">
      {jobs.map((j, i) => (
        <span key={i} className={`job-chip job-chip--${j.status}`} title={j.detail || j.name} aria-label={`后台任务 ${j.name} ${j.status}`}>
          {j.status === 'running' ? <span className="job-spin" aria-hidden="true" /> : j.status === 'failed' ? <span aria-hidden="true">⚠</span> : <span aria-hidden="true">✓</span>}
          <span className="job-name">{j.name}</span>
          <b>{j.status === 'running' ? j.elapsed : j.detail}</b>
        </span>
      ))}
    </div>
  )
}
