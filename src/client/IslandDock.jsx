import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CompanionContext } from '../context/companion.js'
import { Island } from '../components/island/Island.jsx'
import { useDraggable } from '../hooks/useDraggable.js'
import { injectHostStyles, SHADOW_CSS } from './styles.js'

/**
 * 浮层容器 —— shell.overlay 的岛条目。
 *
 * **样式彻底隔离（Shadow DOM）**：
 *   - 岛渲染在宿主元素的 shadow root 内，全部样式放进 shadow 的 <style>，
 *     与原生界面**双向隔离**（岛样式不漏出、原生全局样式不漏进）；
 *   - 宿主只用一个命名空间类 .dsh-island-host（定位/光标），
 *     通用类名（.button/.recent/...）从此无害；
 *   - 主题桥：MutationObserver 跟随原生 body[data-ds-dark-theme]，
 *     在宿主上同步 data-ds-theme，浅色覆盖由 :host([data-ds-theme="light"]) 触发。
 *
 * root 作用域组件：框架注入 useStore（store 快照）与 islandActions。
 * 岛组件只认 CompanionContext，这里把「实时模型 + 本地 UI 状态 + 动作」
 * 组装成与 useCompanionState 完全同构的上下文值，经 portal 跨 shadow 边界
 * 注入同一套 src/components 组件。
 */
export function IslandDock({ useStore, islandActions, t }) {
  const { model } = useStore?.(s => s) ?? {}
  const [expanded, setExpanded] = useState(true)
  const [feedOpen, setFeedOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [approved, setApproved] = useState(null)
  const [feedExtra, setFeedExtra] = useState([])
  const [transient, setTransient] = useState({ retrying: false, unblocking: false, continuing: false })
  const [shadowRoot, setShadowRoot] = useState(null)
  const [theme, setTheme] = useState('dark')
  const hostRef = useRef(null)
  const timers = useRef([])
  // 可拖拽 + 位置记忆（localStorage）
  const drag = useDraggable({ storageKey: 'dsh-dynamic-island:pos' })

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // 挂载：注入宿主样式 + 创建 shadow root + 主题桥（跟随原生深色标记）
  useEffect(() => {
    injectHostStyles()
    const host = hostRef.current
    if (!host || host.shadowRoot) return
    const root = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-dynamic-island'
    style.textContent = SHADOW_CSS
    root.append(style)
    setShadowRoot(root)

    const apply = () => {
      setTheme(document.body?.hasAttribute?.('data-ds-dark-theme') ? 'dark' : 'light')
    }
    apply()
    const obs = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(apply)
      : null
    obs?.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    return () => obs?.disconnect()
  }, [])

  // 宿主 ref：同时供 shadow 挂载与拖拽使用
  const hostRefCb = useCallback(node => {
    hostRef.current = node
    drag.ref.current = node
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      className={`dsh-island-host ${drag.dragging ? 'is-dragging' : ''}`}
      ref={hostRefCb}
      {...drag.handlers}
      style={drag.style}
      data-ds-theme={theme}
      data-plugin="dsh-dynamic-island"
      aria-label={t?.('dock.aria')}
    >
      {shadowRoot && createPortal(
        <CompanionContext.Provider value={companion}>
          <Island />
        </CompanionContext.Provider>,
        shadowRoot,
      )}
    </div>
  )
}
