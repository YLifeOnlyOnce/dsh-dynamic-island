/**
 * Shadow DOM 隔离方案（彻底隔离，双向）。
 *
 * 岛渲染在 shadow root 内：
 *   - 岛的全部样式放进 shadow 的 <style> —— 不会泄漏到原生界面；
 *   - 原生全局样式（button、.recent 等通用类名）也无法穿透进 shadow ——
 *     反向泄漏同样被边界挡住，通用类名从此无害；
 *   - keyframes / CSS 变量在 shadow 内天然作用域化，无需改名。
 *
 * 主题桥：原生 GUI 用 body[data-ds-dark-theme] 标记深色。岛在宿主上
 * 同步一个 data-ds-theme="dark|light" 属性（MutationObserver 跟随），
 * 浅色覆盖用 :host([data-ds-theme="light"]) 触发。
 */

/** 宿主导航（light DOM，唯一一个全局类名，命名空间化避免冲突）。 */
export const HOST_CSS = `
.dsh-island-host {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 99999;
  width: min(480px, calc(100vw - 32px));
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.dsh-island-host.is-dragging { cursor: grabbing; }
.dsh-island-host:has(.island--compact) { width: 76px; height: 76px; }
@media (max-width: 600px) {
  .dsh-island-host { top: 12px; right: 12px; width: calc(100vw - 24px); }
}
`

/**
 * 把（为 light DOM 编写的）岛 CSS 转成 shadow 内可用：
 *   - :root → :host（变量定义在宿主，向 shadow 继承）；
 *   - body:not([data-ds-dark-theme]) → :host([data-ds-theme="light"])；
 *   - 剥离 .island-float 前缀（shadow 内天然隔离，无需作用域类）；
 *   - 纯 .island-float 定位规则 / .is-dragging 光标规则丢弃（宿主样式负责）；
 *   - .island-float .island → .island:not(.island--compact)（撑满宿主宽度，
 *     紧凑点保持 76px）。
 */
export function transformForShadow(css) {
  let out = css
    .replace(/body:not\(\[data-ds-dark-theme\]\)/g, ':host([data-ds-theme="light"])')
    .replace(/:root\b/g, ':host')
  return rewriteRules(out)
}

/** 逐规则重写：剥离 .island-float，丢弃定位/光标规则。 */
function rewriteRules(css) {
  let out = ''
  let i = 0
  const n = css.length
  while (i < n) {
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      if (end === -1) { out += css.slice(i); break }
      out += css.slice(i, end + 2)
      i = end + 2
      continue
    }
    const open = css.indexOf('{', i)
    if (open === -1) { out += css.slice(i); break }
    const prelude = css.slice(i, open)
    let depth = 1
    let j = open + 1
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    const body = css.slice(open + 1, j - 1)
    const head = prelude.trim()

    if (head.startsWith('@media')) {
      out += prelude + '{' + rewriteRules(body) + '}'
    } else if (head.startsWith('@')) {
      out += prelude + '{' + body + '}'
    } else {
      const selectors = head.split(',').map(sel => sel.trim())
      // 剥离所有 .island-float 前缀（可能在 :host(...) 之后出现）
      const stripped = selectors.map(sel => sel.replace(/\s*\.island-float\s*/g, ' ').trim())
      // .island-float .island → .island:not(.island--compact)
      const fixed = stripped.map(sel => {
        if (sel === '.island') return '.island:not(.island--compact)'
        return sel
      })
      // 丢弃：剥离后为空（纯定位）、或指向宿主的 .is-dragging
      const keep = fixed.filter(s => s !== '' && !s.startsWith('.is-dragging'))
      if (keep.length === 0) { i = j; continue }
      out += keep.join(', ') + '{' + body + '}'
    }
    i = j
  }
  return out
}
