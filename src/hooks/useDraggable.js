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
 * 交互细节：
 *   - 按下任意非输入区开始跟踪；位移超过 4px 判定为拖拽；
 *   - 拖拽结束后抑制随之而来的 click（按钮、紧凑点不会误触，单击仍正常）；
 *   - 拖拽期间元素加 `is-dragging` 类（用于 cursor / 禁用过渡 / 禁止选中）；
 *   - 用 setPointerCapture 实现指针移出元素后仍持续拖拽。
 */
export function useDraggable({ storageKey } = {}) {
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
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
  }, [])

  const onPointerMove = useCallback(e => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) d.moved = true
    setOffset(clampOffset(d.baseX + dx, d.baseY + dy))
  }, [clampOffset])

  const onPointerUp = useCallback(e => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    setDragging(false)
    if (d.moved) {
      // 抑制这次拖拽引发的 click，避免误触按钮 / 紧凑点
      const suppress = ev => { ev.preventDefault(); ev.stopPropagation() }
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

  const onPointerCancel = useCallback(() => {
    drag.current = null
    setDragging(false)
  }, [])

  // 组件卸载时兜底释放指针捕获
  useEffect(() => () => {
    if (drag.current?.id && elRef.current?.hasPointerCapture?.(drag.current.id)) {
      elRef.current.releasePointerCapture(drag.current.id)
    }
  }, [])

  return {
    ref: elRef,
    dragging,
    style: offset ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` } : undefined,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  }
}
