/** 状态栏 —— 静态会话信息（原型示意）。 */
export function StatusBar() {
  return (
    <footer className="statusbar">
      <span><i className="status-led" /> Companion 已连接</span>
      <span>会话 01:42:08</span>
      <span>⌘K 打开命令面板 · Esc 收起</span>
    </footer>
  )
}
