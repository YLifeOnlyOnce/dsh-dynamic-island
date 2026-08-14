import { useEffect, useRef } from 'react'
import { ToolCard } from './ToolCard.jsx'

/**
 * 过程面板 —— step / tool / todo / text / system / receipt 的活动流。
 * 内容更新时自动滚动到底部。
 */
export function ActivityFeed({ items }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, items.at(-1)?.text])

  function renderItem(item, i) {
    switch (item.kind) {
      case 'tool':
        return (
          <div className="feed-item feed-item--tool" key={i}>
            <span className="feed-item-mark" aria-hidden="true" />
            <ToolCard tool={item} />
          </div>
        )
      case 'step':
        return (
          <div className="feed-item" key={i}>
            <span className="feed-item-mark" aria-hidden="true" />
            <span className="feed-step">▸ {item.text}</span>
          </div>
        )
      case 'todo':
        return (
          <div className={`feed-item feed-item--${item.status}`} key={i}>
            <span className="feed-item-mark" aria-hidden="true" />
            <span>{item.status === 'done' ? '✓' : '●'} {item.text}</span>
          </div>
        )
      case 'receipt':
        return (
          <div className="feed-item" key={i}>
            <span className="feed-item-mark feed-item-mark--receipt" aria-hidden="true" />
            <span className="feed-receipt">小票 · {item.text}</span>
          </div>
        )
      case 'system':
        return (
          <div className="feed-item feed-item--system" key={i}>
            <span className="feed-item-mark" aria-hidden="true" />
            <span>{item.text}</span>
          </div>
        )
      default:
        return (
          <div className={`feed-item feed-item--${item.tone ?? 'answer'}`} key={i}>
            <span className="feed-item-mark" aria-hidden="true" />
            <span>{item.text}</span>
          </div>
        )
    }
  }

  return (
    <div className="activity-feed" ref={ref} aria-label="过程活动流">
      {items.map(renderItem)}
    </div>
  )
}
