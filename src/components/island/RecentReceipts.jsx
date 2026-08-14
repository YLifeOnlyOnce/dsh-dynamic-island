import { useState } from 'react'

/**
 * 小票堆 —— 最近完成的任务（turn/end 序列），点击选中回看。
 */
export function RecentReceipts({ recent }) {
  const [sel, setSel] = useState(null)
  if (!recent || recent.length === 0) return null
  return (
    <div className="recent" aria-label="最近完成的任务">
      <div className="recent-head">最近完成</div>
      {recent.map((r, i) => (
        <button
          key={i}
          className={`recent-item ${sel === i ? 'recent-item--sel' : ''}`}
          onClick={() => setSel(sel === i ? null : i)}
        >
          <span className="recent-mark" aria-hidden="true">✓</span>
          <span className="recent-title">{r.title}</span>
          <span className="recent-meta">{r.duration} · {r.files} 文件</span>
        </button>
      ))}
    </div>
  )
}
