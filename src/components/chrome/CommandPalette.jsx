import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchIcon } from '../icons/Icons.jsx'
import { useCompanion } from '../../context/companion.js'
import { moods } from '../../data/moods.js'

/**
 * ⌘K 命令面板 —— 过滤八态 + 岛动作；↑↓ 选择、↵ 执行、Esc 关闭。
 * 键盘处理只作用于面板输入框内部；全局 ⌘K / Esc 由 useCompanionState 接管。
 */
export function CommandPalette() {
  const {
    active,
    expanded,
    feedOpen,
    listOpen,
    paletteOpen,
    setPaletteOpen,
    chooseState,
    setExpanded,
    setFeedOpen,
    setListOpen,
  } = useCompanion()

  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)

  const items = useMemo(() => {
    const moodsItems = Object.entries(moods).map(([key, s]) => ({
      id: `mood:${key}`,
      label: `切换到「${s.label}」`,
      hint: s.eyebrow,
      tone: s.tone,
      selected: key === active,
    }))
    const actions = [
      { id: 'toggle-expand', label: expanded ? '收起 Companion' : '展开 Companion', hint: '', selected: false },
      { id: 'toggle-feed', label: feedOpen ? '收起过程面板' : '查看过程', hint: '', selected: false },
      { id: 'toggle-list', label: listOpen ? '收起任务清单' : '展开任务清单', hint: '', selected: false },
    ]
    const all = [...moodsItems, ...actions]
    const q = query.trim().toLowerCase()
    return q
      ? all.filter(i => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q))
      : all
  }, [query, active, expanded, feedOpen, listOpen])

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setSel(0)
      inputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen])

  function apply(id) {
    setPaletteOpen(false)
    if (id.startsWith('mood:')) chooseState(id.slice(5))
    else if (id === 'toggle-expand') setExpanded(e => !e)
    else if (id === 'toggle-feed') setFeedOpen(o => !o)
    else setListOpen(o => !o)
  }

  function onKeyDown(e) {
    if (items.length === 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel(s => (s + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel(s => (s - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[sel]
      if (item) apply(item.id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setPaletteOpen(false)
    }
  }

  if (!paletteOpen) return null

  return (
    <div className="palette-overlay" onClick={() => setPaletteOpen(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="命令面板" onClick={e => e.stopPropagation()}>
        <div className="palette-input-row">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSel(0) }}
            onKeyDown={onKeyDown}
            placeholder="搜索状态或动作…"
          />
          <span className="palette-kbd">ESC</span>
        </div>
        <ul className="palette-list" role="listbox">
          {items.map((it, i) => (
            <li
              key={it.id}
              role="option"
              aria-selected={i === sel}
              className={`palette-item ${i === sel ? 'selected' : ''}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => apply(it.id)}
            >
              <span className={`state-tab-dot ${it.tone ? `state-tab-dot--${it.tone}` : ''}`} />
              <span>{it.label}</span>
              {it.selected && <small>当前</small>}
              {!it.selected && it.hint && <small>{it.hint}</small>}
            </li>
          ))}
          {items.length === 0 && <li className="palette-empty">没有匹配项</li>}
        </ul>
        <div className="palette-hint">↑↓ 选择 · ↵ 执行 · Esc 关闭</div>
      </div>
    </div>
  )
}
