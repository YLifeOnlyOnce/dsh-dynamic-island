import { CloseIcon } from '../icons/Icons.jsx'
import { useCompanion } from '../../context/companion.js'
import { Core } from './Core.jsx'
import { StreamLine } from './StreamLine.jsx'
import { GoalRow } from './GoalRow.jsx'
import { TodoTicker } from './TodoTicker.jsx'
import { ChecklistPanel } from './ChecklistPanel.jsx'
import { ModelChip } from './ModelChip.jsx'
import { ReceiptStats } from './ReceiptStats.jsx'
import { RecentReceipts } from './RecentReceipts.jsx'
import { ActivityFeed } from './ActivityFeed.jsx'
import { ApprovalRow } from './ApprovalRow.jsx'
import { IslandFooter } from './IslandFooter.jsx'

/**
 * 灵动岛本体：紧凑小点 ⇄ 展开卡片。
 * 内容自上而下：主卡（核心 + 文案）→ 进度条 → 目标环 → 任务区
 * → 模型徽章 → 结果小票/小票堆 → 过程面板 → 审批行或页脚。
 */
export function Island() {
  const {
    active,
    state,
    expanded,
    setExpanded,
    listOpen,
    setListOpen,
    approved,
    showFeed,
    feed,
  } = useCompanion()

  return (
    <div className={`island island--${state.tone} ${expanded ? 'island--expanded' : 'island--compact'}`}>
      <button className="compact-trigger" onClick={() => setExpanded(true)} aria-label="展开 Companion">
        <Core tone={state.tone} compact />
      </button>

      <div className="island-content">
        <div className="island-main">
          <Core tone={state.tone} />
          <div className="task-copy">
            <div className="task-topline">
              <span>{state.eyebrow}</span>
              <span className="task-step">{state.step}</span>
            </div>
            <h1>{state.title}</h1>
            {state.stream ? (
              <StreamLine chunks={state.stream} streamKey={active} />
            ) : (
              <p className="task-detail">{state.detail}</p>
            )}
          </div>
          <button className="close-button" title="收起 Companion" onClick={() => setExpanded(false)} aria-label="收起 Companion">
            <CloseIcon />
          </button>
        </div>

        <div className="progress-line" aria-hidden="true"><span style={{ width: `${state.progress}%` }} /></div>

        <GoalRow goal={state.goal} tone={state.tone} />
        {state.todo && active !== 'complete' && (
          <TodoTicker todo={state.todo} open={listOpen} onToggle={() => setListOpen(o => !o)} />
        )}
        {listOpen && state.todos && <ChecklistPanel todos={state.todos} done={state.todo.done} />}
        {state.model && (
          <div className="model-row">
            <ModelChip model={state.model} />
          </div>
        )}
        {state.receipt && <ReceiptStats receipt={state.receipt} />}
        <RecentReceipts recent={state.recent} />

        {showFeed && <ActivityFeed items={feed} />}

        {active === 'approval' ? <ApprovalRow /> : <IslandFooter />}
        {approved !== null && (
          <div className="approval-toast">{approved ? '已批准 · 原生输入栏同步生效' : '已暂缓 · 原生输入栏同步生效'}</div>
        )}
      </div>
    </div>
  )
}
