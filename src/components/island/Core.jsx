/** 核心表情 + 轨道 —— 岛的脸，随 mood 换色调。 */
export function Core({ tone, compact = false }) {
  return (
    <div className={`core-wrap ${compact ? 'core-wrap--compact' : ''}`}>
      <span className="core-orbit core-orbit--one" />
      <span className="core-orbit core-orbit--two" />
      <div className={`core core--${tone}`}>
        <span className="core-glint" />
        <span className="core-eye core-eye--left" />
        <span className="core-eye core-eye--right" />
        <span className="core-smile" />
      </div>
    </div>
  )
}
