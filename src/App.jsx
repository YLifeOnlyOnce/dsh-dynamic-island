// 样式按模块拆分，导入顺序即层叠优先级：基础 → 岛 → 面板 → 演示坞 → 面板覆盖 → 响应式
import './styles/base.css'
import './styles/island.css'
import './styles/panels.css'
import './styles/dock.css'
import './styles/palette.css'
import './styles/responsive.css'

import { CompanionContext } from './context/companion.js'
import { useCompanionState } from './hooks/useCompanionState.js'
import { useDraggable } from './hooks/useDraggable.js'
import { WorkspaceBackdrop } from './components/chrome/WorkspaceBackdrop.jsx'
import { TopBar } from './components/chrome/TopBar.jsx'
import { StateDock } from './components/chrome/StateDock.jsx'
import { StatusBar } from './components/chrome/StatusBar.jsx'
import { CommandPalette } from './components/chrome/CommandPalette.jsx'
import { Island } from './components/island/Island.jsx'

/**
 * 组合根：装配状态源（useCompanionState）→ 注入上下文 → 渲染界面骨架。
 * 自身不含业务逻辑，各区域组件通过 useCompanion() 按需取状态。
 */
export default function App() {
  const companion = useCompanionState()
  // 演示态也可拖拽 + 记忆位置（与插件共用同一 hook）
  const drag = useDraggable({ storageKey: 'dsh-dynamic-island:demo:pos' })

  return (
    <CompanionContext.Provider value={companion}>
      <main className="app-shell">
        <WorkspaceBackdrop />
        <div className="wash wash--left" />
        <div className="wash wash--right" />
        <TopBar />
        <section className="stage" aria-label="dsh companion 交互原型">
          <div
            className={`demo-drag ${drag.dragging ? 'is-dragging' : ''}`}
            ref={drag.ref}
            {...drag.handlers}
            style={drag.style}
          >
            <Island />
          </div>
        </section>
        <StateDock />
        <StatusBar />
        <CommandPalette />
      </main>
    </CompanionContext.Provider>
  )
}
