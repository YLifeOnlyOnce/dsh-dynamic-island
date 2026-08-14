import { useCallback, useRef, useState } from 'react'

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
 * 关键设计（保证拖拽与按钮点击都正常）：
 *   - **不用 setPointerCapture**（会把 click 重定向到容器，按钮失灵）；
 *   - pointerdown 里 **e.preventDefault()** —— 阻止文本选择与原生拖拽，
 *     避免浏览器发 pointercancel 掐断拖拽会话；click 不受影响，按钮照常；
 *   - 按下即把 pointermove/up/cancel 挂到 window（不依赖渲染时序），
 *     指针移出岛外也跟手；位移超 4px 才算拖拽；
 *   - 单击走原生 click 流程；拖拽后的 click 抑制只作用于岛表面内，
 *     原生界面元素的点击绝不拦截。
 *   配套 CSS：宿主需给拖拽表面加 user-select:none（见 island-plugin.css）。
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

  /** 结束拖拽会话；moved=true 时保存位置并抑制本次拖拽引发的 click。 */
  const endDrag = useCallback(moved => {
    window.removeEventListener('pointermove', moveRef.current)
    window.removeEventListener('pointerup', upRef.current)
    window.removeEventListener('pointercancel', cancelRef.current)
    drag.current = null
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

  const onMove = useCallback(e => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
    }
    e.preventDefault() // 拖拽期间禁止页面滚动/选择等原生行为
    setOffset(clampOffset(d.baseX + dx, d.baseY + dy))
  }, [clampOffset])

  const onUp = useCallback(e => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    endDrag(d.moved)
  }, [endDrag])

  const onCancel = useCallback(() => endDrag(false), [endDrag])

  // 稳定的引用，供 add/removeEventListener 使用
  const moveRef = useRef(onMove)
  moveRef.current = onMove
  const upRef = useRef(onUp)
  upRef.current = onUp
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  const onPointerDown = useCallback(e => {
    if (e.button !== 0) return
    if (e.target.closest('input, textarea, select')) return
    // 关键：阻止文本选择与原生拖拽（SVG/图片）→ 不触发 pointercancel
    e.preventDefault()
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offsetRef.current?.x ?? 0,
      baseY: offsetRef.current?.y ?? 0,
      moved: false,
    }
    window.addEventListener('pointermove', moveRef.current)
    window.addEventListener('pointerup', upRef.current)
    window.addEventListener('pointercancel', cancelRef.current)
  }, [])

  return {
    ref: elRef,
    dragging,
    style: offset ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` } : undefined,
    handlers: {
      onPointerDown,
      onDragStart: e => e.preventDefault(), // 防止原生拖拽接管（SVG 图标等）
    },
  }
}
