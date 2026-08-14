import { ChevronIcon, RetryIcon, StopIcon } from '../icons/Icons.jsx'
import { useCompanion } from '../../context/companion.js'

/** 各情绪对应的页脚状态文案。 */
const STATUS_TEXT = {
  idle: '等待指令',
  thinking: '实时同步',
  working: '执行中 · 00:47',
  complete: '已保存到会话',
  alert: '等待处理',
  blocked: '目标暂停',
  'max-tokens': '结果不完整',
}

/**
 * 岛页脚 —— 「查看过程」开关 + 按情绪分化的动作按钮（停止/重试/解除阻塞/继续）。
 * 所有动作都是镜像操作入口，只做本地反馈。
 */
export function IslandFooter() {
  const {
    active,
    state,
    feedOpen,
    setFeedOpen,
    stopping,
    handleStop,
    retrying,
    handleRetry,
    unblocking,
    handleUnblock,
    continuing,
    handleContinue,
  } = useCompanion()

  return (
    <div className="island-footer">
      <button className="details-button" onClick={() => setFeedOpen(o => !o)} aria-expanded={feedOpen}>
        查看过程 <ChevronIcon open={feedOpen} />
      </button>
      <span className="footer-right">
        {active === 'working' && (
          <button className="button button--stop" onClick={handleStop} disabled={stopping}>
            {stopping ? '正在停止…' : <><StopIcon /> 停止</>}
          </button>
        )}
        {active === 'alert' && (
          <button className="button button--retry" onClick={handleRetry} disabled={retrying}>
            {retrying ? '重试中…' : <><RetryIcon /> 重试</>}
          </button>
        )}
        {active === 'blocked' && (
          <button className="button button--blocked" onClick={handleUnblock} disabled={unblocking}>
            {unblocking ? '解除中…' : '解除阻塞'}
          </button>
        )}
        {active === 'max-tokens' && (
          <button className="button button--continue" onClick={handleContinue} disabled={continuing}>
            {continuing ? '继续中…' : '继续'}
          </button>
        )}
        <span className="footer-status">
          <i className={`status-dot status-dot--${state.tone}`} />
          {STATUS_TEXT[active]}
        </span>
      </span>
    </div>
  )
}
