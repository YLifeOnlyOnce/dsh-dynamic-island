import { SparkIcon } from '../icons/Icons.jsx'

/** 顶部栏 —— 静态品牌区（原型示意）。 */
export function TopBar() {
  return (
    <header className="topbar">
      <div className="wordmark"><span className="wordmark-mark"><SparkIcon size={14} /></span>dsh 灵动岛</div>
      <div className="project-pill"><span className="project-dot" /> companion-web <span className="chevron">⌄</span></div>
      <div className="top-actions">
        <span className="synced">已同步</span>
        <button className="icon-button" title="打开设置" aria-label="打开设置">•••</button>
      </div>
    </header>
  )
}
