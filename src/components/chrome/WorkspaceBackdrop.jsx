/** 工作区背景 —— 一个静态的 IDE 示意（装饰性，aria-hidden）。 */
export function WorkspaceBackdrop() {
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
