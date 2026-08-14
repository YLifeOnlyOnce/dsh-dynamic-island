/** 完整任务清单（三态）—— todo/write 的展开视图。 */
export function ChecklistPanel({ todos, done }) {
  return (
    <div className="checklist" aria-label="任务清单">
      {todos.map((t, i) => (
        <div key={i} className={`check-item ${i < done ? 'check-item--done' : i === done ? 'check-item--now' : ''}`}>
          <span className="check-mark" aria-hidden="true">{i < done ? '✓' : i === done ? '◐' : '○'}</span>
          <span className="check-text">{t}</span>
          {i === done && <span className="check-now">进行中</span>}
        </div>
      ))}
    </div>
  )
}
