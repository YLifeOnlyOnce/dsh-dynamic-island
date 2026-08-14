import { useEffect, useRef, useState } from 'react'

/**
 * 流式预览行 —— 对应 assistant/chunk（reasoning-delta / text-delta）。
 * 打字机效果；prefers-reduced-motion 下直接显示全文。
 */
export function StreamLine({ chunks, streamKey }) {
  const full = chunks.join('')
  const [shown, setShown] = useState('')
  const reduced = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (reduced.current) {
      setShown(full)
      return
    }
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i += 2
      setShown(full.slice(0, i))
      if (i >= full.length) clearInterval(id)
    }, 22)
    return () => clearInterval(id)
    // streamKey 变化即整条流重置（换状态/换演示）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamKey])

  return (
    <p className={`stream-line ${shown.length < full.length ? 'stream-line--typing' : ''}`} aria-live="polite">
      <span>{shown}</span>
      <span className="stream-caret" aria-hidden="true" />
    </p>
  )
}
