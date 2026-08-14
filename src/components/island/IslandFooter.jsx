import { ChevronIcon, RetryIcon } from '../icons/Icons.jsx'
import { ModelChip } from './ModelChip.jsx'
import { useCompanion } from '../../context/companion.js'

/** 各情绪对应的页脚状态文案。 */
const STATUS_TEXT = {
  idle: '等待指令',
  thinking: '实时同步',
  working: '执行中',
  complete: '已保存到会话',
  alert: '等待处理',
  blocked: '目标暂停',
  'max-tokens': '结果不完整',
}

/**
 * 岛页脚 —— 「查看过程」开关（feed 为空时隐藏）+ 模型徽章 + 状态。
 * 动作按钮按情绪分化（重试/解除阻塞/继续）；停止已交给 Harness 原生界面。
 */
export function IslandFooter() {
  const {
    active,
    state,
    feedOpen,
    setFeedOpen,
    feed,
    retrying,
    handleRetry,
    unblocking,
    handleUnblock,
    continuing,
    handleContinue,
  } = useCompanion()

  const hasFeed = feed.length > 0

  return (
    <div className="island-footer">
      {hasFeed && (
        <button className="details-button" onClick={() => setFeedOpen(o => !o)} aria-expanded={feedOpen}>
          查看过程 <ChevronIcon open={feedOpen} />
        </button>
      )}
      <span className="footer-right">
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
        {state.model && <ModelChip model={state.model} />}
        <span className="footer-status">
          <i className={`status-dot status-dot--${state.tone}`} />
          {STATUS_TEXT[active]}
        </span>
      </span>
    </div>
  )
}
