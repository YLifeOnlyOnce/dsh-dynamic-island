import { useState } from 'react'
import { CheckIcon, CopyIcon } from '../icons/Icons.jsx'

/**
 * 工具命令卡 —— 对应 tool/call.arguments + tool/result（exit/error/meta）。
 * 退出码胶囊带文字（不只用颜色），命令可一键复制。
 */
export function ToolCard({ tool }) {
  const [copied, setCopied] = useState(false)
  const pending = tool.exit === null || tool.exit === undefined
  const ok = !pending && tool.exit === 0

  function copy() {
    try {
      navigator.clipboard?.writeText(tool.args)
    } catch {
      /* clipboard 不可用时静默失败（原型） */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="feed-tool">
      <div className="feed-tool-head">
        <span className="feed-tool-name">◈ {tool.name}</span>
        <span className={`exit-pill ${pending ? 'exit-pill--pending' : ok ? 'exit-pill--ok' : 'exit-pill--err'}`}>
          {pending ? '待审批' : `exit ${tool.exit}`}
        </span>
      </div>
      <div className="feed-tool-args">
        <code title={tool.args}>{tool.args}</code>
        <button className={`copy-button ${copied ? 'copied' : ''}`} onClick={copy} title="复制命令" aria-label="复制命令">
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
        </button>
      </div>
      <div className="feed-tool-meta">
        <span>⏱ {tool.duration}</span>
        {pending && <span>等待批准</span>}
      </div>
    </div>
  )
}
