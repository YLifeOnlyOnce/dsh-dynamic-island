import { useCallback, useEffect, useRef, useState } from 'react'

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
 * 用法：
 *   const drag = useDraggable({ storageKey: 'my-widget:pos' })
 *   <div ref={drag.ref} {...drag.handlers} style={drag.style} className={drag.dragging ? 'is-dragging' : ''}>
 *
 * 设计要点（不干扰原生交互）：
 *   - **不用 setPointerCapture**：捕获会把 click 重定向到容器，导致岛内按钮
 *     （查看过程 / 批准 / 暂不…）收不到点击。这里按下只记录起点，
 *     随后在 window 上挂 pointermove/pointerup 完成拖拽会话；
 *   - 位移超过 4px 才判定为拖拽（此时加 `is-dragging` 类并抑制随后的 click）；
 *   - 单击（未移动）完全走原生 click 流程，按钮照常工作；
 *   - 拖拽后的 click 抑制只作用于「落在岛表面内」的目标，
 *     原生界面元素的点击绝不拦截。
 */
export function useDraggable({ storageKey } = {}) {
  const [tracking, setTracking] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState(() => readOffset(storageKey))
  const elRef = useRef(null)
  const drag = useRef(null)
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  /** 把候选平移约束在视口内（元素必须整体可见）。 */
  const clampOffset = useCallback((x, y) => {
    const el = elRef.current
    if (!el) return { x, y }
    const r = el.getBoundingClientRect()
    const layoutLeft = r.left - offsetRef.current.x
    const layoutTop = r.top - offsetRef.current.y
    return {
      x: clamp(x, -layoutLeft, window.innerWidth - r.width - layoutLeft),
      y: clamp(y, -layoutTop, window.innerHeight - r.height - layoutTop),
    }
  }, [])

  /** 结束一次拖拽会话；moved=true 时保存位置并抑制本次拖拽引发的 click。 */
  const endDrag = useCallback(moved => {
    drag.current = null
    setTracking(false)
    setDragging(false)
    if (moved) {
      // 只抑制「落在岛表面内」的 click（拖拽后防误触岛内按钮/紧凑点）；
      // 岛外元素（原生界面）的点击绝不受影响。
      const suppress = ev => {
        if (!elRef.current || !elRef.current.contains(ev.target)) return
        ev.preventDefault()
        ev.stopPropagation()
      }
      window.addEventListener('click', suppress, { capture: true, once: true })
      if (storageKey && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(offsetRef.current))
        } catch {
          /* 隐私模式等场景静默失败 */
        }
      }
    }
  }, [storageKey])

  // 拖拽会话的 window 级监听（按下即挂，松开即卸；不干扰按钮点击）
  useEffect(() => {
    if (!tracking) return
    const move = e => {
      const d = drag.current
      if (!d || e.pointerId !== d.id) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (!d.moved && Math.hypot(dx, dy) < 4) return
      if (!d.moved) {
        d.moved = true
        setDragging(true)
      }
      setOffset(clampOffset(d.baseX + dx, d.baseY + dy))
    }
    const up = e => {
      const d = drag.current
      if (!d || e.pointerId !== d.id) return
      endDrag(d.moved)
    }
    const cancel = () => endDrag(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [tracking, clampOffset, endDrag])

  const onPointerDown = useCallback(e => {
    if (e.button !== 0) return
    if (e.target.closest('input, textarea, select')) return
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offsetRef.current?.x ?? 0,
      baseY: offsetRef.current?.y ?? 0,
      moved: false,
    }
    setTracking(true)
  }, [])

  return {
    ref: elRef,
    dragging,
    style: offset ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` } : undefined,
    handlers: { onPointerDown },
  }
}
