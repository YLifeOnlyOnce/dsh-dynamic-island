import { useEffect, useRef, useState } from 'react'

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

/** 从 localStorage 读记忆位置；损坏/不可用时返回 null。 */
function readOffset(storageKey) {
  if (!storageKey || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const { x, y } = JSON.parse(raw)
    if (typeof x === 'number' && typeof y === 'number') return { x, y }
  } catch {
    /* 损坏数据忽略 */
  }
  return null
}

/**
 * 拖拽移动：transform 平移 + 视口约束 + localStorage 位置记忆。
 *
 * 模式照抄 GUI 内部已被验证可用的列宽拖拽（ui-layout 的 DragHandle）：
 * 元素级 onPointerDown/Move/Up + setPointerCapture + hasPointerCapture 守卫
 * + rAF 节流。唯一区别是**延迟捕获**：
 *   - 按下只记录起点、不捕获 → 普通点击走原生 click，按钮照常工作；
 *   - 位移超过 4px 判定为拖拽时才 setPointerCapture → 指针移出岛外仍跟手，
 *     且捕获后 click 落在岛容器上，不会误触内部按钮；
 *   - 捕获后无需任何 window 级监听或点击抑制。
 */
export function useDraggable({ storageKey } = {}) {
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState(() => readOffset(storageKey))
  const elRef = useRef(null)
  const drag = useRef(null)
  const frame = useRef(null)
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  /** 把候选平移约束在视口内（元素必须整体可见）。 */
  const clampOffset = (x, y) => {
    const el = elRef.current
    if (!el) return { x, y }
    const r = el.getBoundingClientRect()
    const layoutLeft = r.left - offsetRef.current.x
    const layoutTop = r.top - offsetRef.current.y
    return {
      x: clamp(x, -layoutLeft, window.innerWidth - r.width - layoutLeft),
      y: clamp(y, -layoutTop, window.innerHeight - r.height - layoutTop),
    }
  }

  /** 结束拖拽：释放捕获、结算 rAF、保存位置。 */
  const finish = e => {
    const d = drag.current
    if (!d) return
    if (d.captured && e?.currentTarget?.hasPointerCapture?.(d.id)) {
      e.currentTarget.releasePointerCapture(d.id)
    }
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
    const moved = d.moved
    drag.current = null
    setDragging(false)
    if (moved && storageKey && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(offsetRef.current))
      } catch {
        /* 隐私模式等场景静默失败 */
      }
    }
  }

  const onPointerDown = e => {
    if (e.button !== 0) return
    if (e.target.closest('input, textarea, select')) return
    e.preventDefault() // 阻止文本选择/原生拖拽
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offsetRef.current?.x ?? 0,
      baseY: offsetRef.current?.y ?? 0,
      moved: false,
      captured: false,
    }
  }

  const onPointerMove = e => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.captured) {
      // 进入拖拽才捕获指针（与 DragHandle 相同机制；简单点击不捕获）
      e.currentTarget.setPointerCapture?.(d.id)
      d.captured = true
      d.moved = true
      setDragging(true)
    }
    frame.current ??= requestAnimationFrame(() => {
      frame.current = null
      setOffset(clampOffset(d.baseX + dx, d.baseY + dy))
    })
  }

  const onPointerUp = e => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    finish(e)
  }

  const onPointerCancel = e => finish(e)

  // 卸载时兜底释放可能残留的捕获
  useEffect(() => () => {
    const d = drag.current
    if (d?.captured && elRef.current?.hasPointerCapture?.(d.id)) {
      elRef.current.releasePointerCapture(d.id)
    }
  }, [])

  return {
    ref: elRef,
    dragging,
    style: offset ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` } : undefined,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onDragStart: e => e.preventDefault(), // 防止原生拖拽接管（SVG 图标等）
    },
  }
}
