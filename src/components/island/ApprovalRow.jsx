import { ArrowIcon } from '../icons/Icons.jsx'
import { useCompanion } from '../../context/companion.js'

/**
 * 审批行 —— 快照 pending 中 approval 交互的同步镜像入口。
 * 岛不驱动底层状态，只记录结果并回执（live 模式经 respond() 走真实审批面）。
 */
export function ApprovalRow() {
  const { approved, handleApproval, state } = useCompanion()
  const copy = state?.approval?.reason ?? (state?.approval?.toolName ? `将执行工具 · ${state.approval.toolName}` : '这一步将修改项目依赖')

  return (
    <div className="approval-row">
      <div className="approval-copy"><span className="approval-lock">⌁</span><span>{copy}</span></div>
      {approved === null ? (
        <div className="approval-actions">
          <button className="button button--quiet" onClick={() => handleApproval(false)}>暂不</button>
          <button className="button button--approve" onClick={() => handleApproval(true)}>批准 <ArrowIcon /></button>
        </div>
      ) : (
        <div className={`approval-resolved ${approved ? 'approval-resolved--ok' : 'approval-resolved--no'}`}>
          <span className="approval-resolved-mark">{approved ? '✓' : '—'}</span>
          <span>{approved ? '已批准 · 等待 Harness 同步执行' : '已暂缓 · 方案保留'}</span>
        </div>
      )}
    </div>
  )
}
