import { ChevronIcon } from '../icons/Icons.jsx'

/**
 * Todo 清单点 + 展开按钮 —— 对应 todo/write 整表快照。
 * 圆点进度（done / active / pending）+ 当前任务 + 「清单」展开入口。
 */
export function TodoTicker({ todo, open, onToggle }) {
  const dots = Array.from({ length: todo.total }, (_, i) => {
    if (i < todo.done) return 'done'
    if (i === todo.done && todo.current) return 'active'
    return 'todo'
  })
  return (
    <div className="todo-ticker">
      <span className="todo-dots" aria-hidden="true">
        {dots.map((s, i) => (
          <i key={i} className={`todo-dot todo-dot--${s}`} />
        ))}
      </span>
      <span className="todo-copy">{todo.current ? `正在做 · ${todo.current}` : `${todo.done} / ${todo.total} 项全部完成`}</span>
      <button className="list-toggle" onClick={onToggle} aria-expanded={open} aria-label="任务清单">
        清单 <ChevronIcon open={open} />
      </button>
    </div>
  )
}
