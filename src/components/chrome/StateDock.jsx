import { SparkIcon } from '../icons/Icons.jsx'
import { useCompanion } from '../../context/companion.js'
import { moods } from '../../data/moods.js'

/**
 * 底部演示坞 —— 八态切换 + 自动演示 + ⌘K 命令面板入口。
 * 这是原型专属的演示工具，不属于岛本身。
 */
export function StateDock() {
  const {
    active,
    chooseState,
    autoPlaying,
    startDemo,
    stopDemo,
    setPaletteOpen,
  } = useCompanion()

  return (
    <nav className="state-dock" aria-label="演示状态切换">
      <div className="dock-label"><span className="dock-mark"><SparkIcon size={13} /></span> 灵动岛演示</div>
      <div className="state-tabs" role="tablist" aria-label="切换任务状态">
        {Object.entries(moods).map(([key, item]) => (
          <button
            key={key}
            className={key === active ? 'state-tab active' : 'state-tab'}
            onClick={() => chooseState(key)}
            role="tab"
            aria-selected={key === active}
          >
            <span className={`state-tab-dot state-tab-dot--${item.tone}`} />{item.label}
          </button>
        ))}
      </div>
      <div className="dock-actions">
        <button className={`demo-button ${autoPlaying ? 'demo-button--live' : ''}`} onClick={autoPlaying ? stopDemo : startDemo}>
          {autoPlaying ? '⏹ 停止演示' : '▶ 自动演示'}
        </button>
        <button className="palette-trigger" onClick={() => setPaletteOpen(true)} title="命令面板 (⌘K)" aria-label="打开命令面板 (⌘K)">⌘K</button>
      </div>
    </nav>
  )
}
