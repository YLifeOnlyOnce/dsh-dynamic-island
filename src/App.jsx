import { useState } from 'react'
import './App.css'

const states = {
  thinking: {
    label: '思考',
    eyebrow: '正在规划',
    title: '梳理登录页的响应式问题',
    detail: '正在比对组件结构与已有样式',
    step: '02 / 06',
    progress: 32,
    tone: 'aqua',
  },
  working: {
    label: '执行',
    eyebrow: '正在执行',
    title: '检查移动端断点',
    detail: 'rg "@media|sm:|md:" src/components',
    step: '03 / 06',
    progress: 51,
    tone: 'mint',
  },
  approval: {
    label: '确认',
    eyebrow: '需要你的确认',
    title: '准备安装一个开发依赖',
    detail: 'pnpm add -D @tailwindcss/container-queries',
    step: '下一步',
    progress: 66,
    tone: 'coral',
  },
  complete: {
    label: '完成',
    eyebrow: '任务已完成',
    title: '登录页已经适配移动端',
    detail: '修改 3 个文件 · 验证了 4 个断点',
    step: '03:18',
    progress: 100,
    tone: 'lime',
  },
  alert: {
    label: '异常',
    eyebrow: '需要查看',
    title: '本地预览没有正常启动',
    detail: '端口 5173 已被占用，等待你的处理',
    step: '已暂停',
    progress: 51,
    tone: 'amber',
  },
}

function SparkIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.8c.7 5.55 2.25 7.1 7.2 7.82-4.95.71-6.5 2.27-7.2 7.82-.7-5.55-2.25-7.11-7.2-7.82 4.95-.72 6.5-2.27 7.2-7.82Z" fill="currentColor" />
      <path d="M18.6 16.2c.25 1.9.79 2.44 2.6 2.7-1.81.26-2.35.8-2.6 2.7-.25-1.9-.79-2.44-2.6-2.7 1.81-.26 2.35-.8 2.6-2.7Z" fill="currentColor" opacity=".72" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function Core({ tone, compact = false }) {
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

function WorkspaceBackdrop() {
  return (
    <div className="workspace" aria-hidden="true">
      <aside className="app-rail">
        <div className="rail-mark"><span /><span /><span /></div>
        <div className="rail-icons"><i className="selected" /><i /><i /><i /><i /></div>
        <i className="rail-bottom" />
      </aside>
      <aside className="file-panel">
        <div className="panel-title">EXPLORER <span>···</span></div>
        <div className="project-name">COMPANION</div>
        <div className="tree-row active">⌄&nbsp; src</div>
        <div className="tree-row indent">⌄&nbsp; components</div>
        <div className="tree-row indent-2 selected-file">◈&nbsp; LoginForm.tsx</div>
        <div className="tree-row indent-2">◈&nbsp; Logo.tsx</div>
        <div className="tree-row indent">⌄&nbsp; styles</div>
        <div className="tree-row indent-2">#&nbsp; tokens.css</div>
        <div className="tree-row">⌄&nbsp; public</div>
      </aside>
      <div className="editor">
        <div className="editor-tabs"><span className="tab active">◈&nbsp; LoginForm.tsx <b>×</b></span><span className="tab">#&nbsp; tokens.css</span></div>
        <div className="breadcrumbs">src&nbsp; / &nbsp;components&nbsp; / &nbsp;<strong>LoginForm.tsx</strong></div>
        <div className="code">
          <div><em>1</em><span className="pink">import</span> <span className="blue">{'{ useState }'}</span> <span className="pink">from</span> <span className="sand">'react'</span></div>
          <div><em>2</em>&nbsp;</div>
          <div><em>3</em><span className="pink">export function</span> <span className="blue">LoginForm</span>() {'{'}</div>
          <div><em>4</em>&nbsp;&nbsp;<span className="pink">const</span> [email, setEmail] = <span className="blue">useState</span>(<span className="sand">''</span>)</div>
          <div><em>5</em>&nbsp;</div>
          <div><em>6</em>&nbsp;&nbsp;<span className="pink">return</span> (</div>
          <div><em>7</em>&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="blue">form</span> <span className="aqua">className</span>=<span className="sand">"login-form"</span>&gt;</div>
          <div><em>8</em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="blue">label</span>&gt;邮箱地址&lt;/<span className="blue">label</span>&gt;</div>
          <div><em>9</em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="blue">input</span> <span className="aqua">value</span>={'{email}'} /&gt;</div>
          <div><em>10</em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="blue">button</span>&gt;继续&lt;/<span className="blue">button</span>&gt;</div>
          <div><em>11</em>&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="blue">form</span>&gt;</div>
          <div><em>12</em>&nbsp;&nbsp;)</div>
          <div><em>13</em>{'}'}</div>
        </div>
      </div>
      <aside className="inspector">
        <div className="inspector-head"><span>任务</span><b>···</b></div>
        <div className="history-item"><i className="history-dot done"/><span>读取项目规范<small>刚刚</small></span></div>
        <div className="history-item"><i className="history-dot current"/><span>修复移动端布局<small>进行中</small></span></div>
        <div className="inspector-rule" />
        <div className="inspector-note">Companion 正在同步任务状态</div>
      </aside>
    </div>
  )
}

function App() {
  const [active, setActive] = useState('thinking')
  const [expanded, setExpanded] = useState(true)
  const [approved, setApproved] = useState(null)
  const state = states[active]

  function chooseState(key) {
    setActive(key)
    setExpanded(true)
    setApproved(null)
  }

  function handleApproval(value) {
    setApproved(value)
    window.setTimeout(() => chooseState(value ? 'working' : 'thinking'), 700)
  }

  return (
    <main className="app-shell">
      <WorkspaceBackdrop />
      <div className="wash wash--left" />
      <div className="wash wash--right" />
      <header className="topbar">
        <div className="wordmark"><span className="wordmark-mark"><SparkIcon size={14} /></span>dsh 灵动岛</div>
        <div className="project-pill"><span className="project-dot" /> companion-web <span className="chevron">⌄</span></div>
        <div className="top-actions"><span className="synced">已同步</span><button className="icon-button" title="打开设置" aria-label="打开设置">•••</button></div>
      </header>

      <section className="stage" aria-label="dsh companion 交互原型">
        <div className={`island island--${state.tone} ${expanded ? 'island--expanded' : 'island--compact'}`}>
          <button className="compact-trigger" onClick={() => setExpanded(true)} aria-label="展开 Companion">
            <Core tone={state.tone} compact />
          </button>
          <div className="island-content">
            <div className="island-main">
              <Core tone={state.tone} />
              <div className="task-copy">
                <div className="task-topline"><span>{state.eyebrow}</span><span className="task-step">{state.step}</span></div>
                <h1>{state.title}</h1>
                <p>{state.detail}</p>
              </div>
              <button className="close-button" title="收起 Companion" onClick={() => setExpanded(false)} aria-label="收起 Companion"><CloseIcon /></button>
            </div>

            <div className="progress-line" aria-hidden="true"><span style={{ width: `${state.progress}%` }} /></div>

            {active === 'approval' ? (
              <div className="approval-row">
                <div className="approval-copy"><span className="approval-lock">⌁</span><span>这一步将修改项目依赖</span></div>
                <div className="approval-actions">
                  <button className="button button--quiet" onClick={() => handleApproval(false)}>暂不</button>
                  <button className="button button--approve" onClick={() => handleApproval(true)}>批准 <ArrowIcon /></button>
                </div>
              </div>
            ) : (
              <div className="island-footer">
                <button className="details-button">查看过程 <ArrowIcon /></button>
                <span className="footer-status"><i className={`status-dot status-dot--${state.tone}`} /> {active === 'complete' ? '已保存到会话' : active === 'alert' ? '等待处理' : '实时同步'}</span>
              </div>
            )}
            {approved !== null && <div className="approval-toast">{approved ? '已批准，正在继续' : '已保留当前方案'}</div>}
          </div>
        </div>
      </section>

      <nav className="state-dock" aria-label="演示状态切换">
        <div className="dock-label"><span className="dock-mark"><SparkIcon size={13} /></span> 灵动岛演示</div>
        <div className="state-tabs" role="tablist" aria-label="切换任务状态">
          {Object.entries(states).map(([key, item]) => (
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
      </nav>

      <footer className="statusbar"><span><i className="status-led" /> Companion 已连接</span><span>会话 01:42:08</span><span>⌘ K 打开命令面板</span></footer>
    </main>
  )
}

export default App
