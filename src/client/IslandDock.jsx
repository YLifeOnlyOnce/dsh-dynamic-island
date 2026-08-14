import { useEffect, useMemo, useRef, useState } from 'react'
import { CompanionContext } from '../context/companion.js'
import { Island } from '../components/island/Island.jsx'
import { useDraggable } from '../hooks/useDraggable.js'

/**
 * 浮层容器 —— shell.overlay 的岛条目。
 *
 * root 作用域组件：框架注入 useStore（store 快照）与 islandActions
 * （register.inject 回传的桥动作）。岛组件只认 CompanionContext，
 * 这里把「实时模型 + 本地 UI 状态 + 动作」组装成与 useCompanionState
 * 完全同构的上下文值 —— 同一套 src/components 组件直接复用。
 */
export function IslandDock({ useStore, islandActions, t }) {
  const { model } = useStore?.(s => s) ?? {}
  const [expanded, setExpanded] = useState(true)
  const [feedOpen, setFeedOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [approved, setApproved] = useState(null)
  const [feedExtra, setFeedExtra] = useState([])
  const [transient, setTransient] = useState({ retrying: false, unblocking: false, continuing: false })
  const timers = useRef([])
  // 可拖拽 + 位置记忆（localStorage）
  const drag = useDraggable({ storageKey: 'dsh-dynamic-island:pos' })

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const appendFeed = text => setFeedExtra(prev => [...prev, { kind: 'system', text }])
  const mark = (key, value) => setTransient(prev => ({ ...prev, [key]: value }))
  const flash = (key, ms = 1600) => {
    mark(key, true)
    timers.current.push(setTimeout(() => mark(key, false), ms))
  }

  const companion = useMemo(() => {
    const feed = model ? [...model.feed, ...feedExtra] : feedExtra
    const actions = {
      setExpanded,
      setFeedOpen,
      setListOpen,
      setPaletteOpen: () => {},
      chooseState: () => {}, // 插件内无演示切换
      startDemo: () => {},
      stopDemo: () => {},
      handleApproval(value) {
        // 插件模式已移除审批面（ignoreApproval）——此路径不可达，仅保留兜底反馈。
        setApproved(value)
        appendFeed(value ? '已批准 · 原生输入栏同步生效' : '已暂缓 · 方案保留')
      },
      handleRetry() {
        mark('retrying', true)
        islandActions?.retry?.()
        appendFeed('已请求重试 · 待接入 session.prompt')
        flash('retrying')
      },
      handleUnblock() {
        mark('unblocking', true)
        islandActions?.unblock?.()
        appendFeed('已请求解除阻塞 · 待接入 goal resume')
        flash('unblocking')
      },
      handleContinue() {
        mark('continuing', true)
        islandActions?.continueTurn?.()
        appendFeed('已请求继续 · 待接入回合续跑')
        flash('continuing')
      },
    }
    return {
      active: model?.mood ?? 'idle',
      state: model ?? null,
      feed,
      showFeed: feedOpen && feed.length > 0,
      expanded,
      feedOpen,
      listOpen,
      paletteOpen: false,
      approved,
      autoPlaying: false,
      retrying: transient.retrying,
      unblocking: transient.unblocking,
      continuing: transient.continuing,
      ...actions,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, feedExtra, expanded, feedOpen, listOpen, approved, transient])

  if (!companion.state) return null

  return (
    <div
      className={`island-float ${drag.dragging ? 'is-dragging' : ''}`}
      ref={drag.ref}
      {...drag.handlers}
      style={drag.style}
      data-plugin="dsh-dynamic-island"
      aria-label={t?.('dock.aria')}
    >
      <CompanionContext.Provider value={companion}>
        <Island />
      </CompanionContext.Provider>
    </div>
  )
}
