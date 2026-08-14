import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { moods, DEMO_TIMELINE } from '../data/moods.js'

/**
 * Companion 的全部交互状态与动作（唯一状态源）。
 *
 * 所有「操作反馈」都遵循同一原则：岛是 Harness 的**镜像操作入口**，
 * 只做本地乐观反馈并追加过程注记，绝不驱动底层任务状态——
 * 审批、停止、重试、解除阻塞、续跑在真实插件里都要落到原生面。
 */
export function useCompanionState() {
  const [active, setActive] = useState('idle')
  const [expanded, setExpanded] = useState(true)
  const [approved, setApproved] = useState(null)
  const [feedOpen, setFeedOpen] = useState(true)
  const [listOpen, setListOpen] = useState(false)
  const [feedExtra, setFeedExtra] = useState([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
  const [continuing, setContinuing] = useState(false)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const timers = useRef([])

  const state = moods[active]
  const feed = useMemo(() => [...state.feed, ...feedExtra], [state, feedExtra])
  const showFeed = feedOpen && feed.length > 0

  const pushTimer = useCallback(id => {
    timers.current.push(id)
  }, [])

  const stopDemo = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setAutoPlaying(false)
  }, [])

  const resetFor = useCallback(key => {
    setActive(key)
    setExpanded(true)
    setApproved(null)
    setFeedExtra([])
    setStopping(false)
    setRetrying(false)
    setUnblocking(false)
    setContinuing(false)
  }, [])

  const chooseState = useCallback(key => {
    if (autoPlaying) stopDemo()
    resetFor(key)
  }, [autoPlaying, stopDemo, resetFor])

  const handleApproval = useCallback(value => {
    // 审批由 Harness 原生输入栏处理；灵动岛是同步镜像的附加操作入口。
    setApproved(value)
    setFeedExtra(prev => [
      ...prev,
      { kind: 'system', text: value ? '已批准 · 原生输入栏同步生效' : '已暂缓 · 方案保留' },
    ])
  }, [])

  const startDemo = useCallback(() => {
    if (autoPlaying) return
    setAutoPlaying(true)
    setFeedOpen(true)
    let t = 0
    for (const step of DEMO_TIMELINE) {
      pushTimer(setTimeout(() => {
        // 直接 resetFor，不走 chooseState（避免停掉后续定时器）
        resetFor(step.key)
        if (step.key === 'approval') {
          // 演示里自动批准，展示「镜像入口 + 同步生效」的完整弧线
          pushTimer(setTimeout(() => handleApproval(true), 1600))
        }
      }, t))
      t += step.dur
    }
    pushTimer(setTimeout(() => setAutoPlaying(false), t))
  }, [autoPlaying, pushTimer, resetFor, handleApproval])

  const handleStop = useCallback(() => {
    // 对应 agent/turn-stopping：只发反馈，不驱动底层任务。
    setStopping(true)
    setFeedExtra(prev => [...prev, { kind: 'system', text: '已请求停止 · agent/turn-stopping' }])
    pushTimer(setTimeout(() => setStopping(false), 1800))
  }, [pushTimer])

  const handleRetry = useCallback(() => {
    // 对应 agent/request 重新发起。
    setRetrying(true)
    setFeedExtra(prev => [...prev, { kind: 'system', text: '已重新发起 · agent/request' }])
    pushTimer(setTimeout(() => {
      setRetrying(false)
      chooseState('working')
    }, 1500))
  }, [pushTimer, chooseState])

  const handleUnblock = useCallback(() => {
    // 对应 goal 解除阻塞后继续推进。
    setUnblocking(true)
    setFeedExtra(prev => [...prev, { kind: 'system', text: '已解除阻塞 · agent 继续推进' }])
    pushTimer(setTimeout(() => setUnblocking(false), 1500))
  }, [pushTimer])

  const handleContinue = useCallback(() => {
    // 对应 max-tokens 后由插件续跑当前回合。
    setContinuing(true)
    setFeedExtra(prev => [...prev, { kind: 'system', text: '已要求继续 · 回合续跑' }])
    pushTimer(setTimeout(() => setContinuing(false), 1500))
  }, [pushTimer])

  // ⌘K / Ctrl+K 命令面板；Esc 先关面板，再收起岛。
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(p => !p)
        return
      }
      if (e.key === 'Escape') {
        if (paletteOpen) setPaletteOpen(false)
        else setExpanded(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen])

  // 卸载时清掉所有演示定时器
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return {
    // 数据
    active,
    state,
    feed,
    showFeed,
    // 面板开关
    expanded,
    feedOpen,
    listOpen,
    paletteOpen,
    // 交互态
    approved,
    stopping,
    retrying,
    unblocking,
    continuing,
    autoPlaying,
    // 动作
    setExpanded,
    setFeedOpen,
    setListOpen,
    setPaletteOpen,
    chooseState,
    startDemo,
    stopDemo,
    handleApproval,
    handleStop,
    handleRetry,
    handleUnblock,
    handleContinue,
  }
}
