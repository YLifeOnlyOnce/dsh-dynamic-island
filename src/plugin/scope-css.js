/**
 * CSS 作用域化（纯函数，可独立测试）。
 *
 * 插件注入的样式必须**只作用于 .island-float 内部**，否则通用类名
 * （.button / .status-dot / .recent / .progress-line …）会泄漏到原生界面
 * （例如审批输入栏），改变 Harness 原有交互的样式。
 *
 * 处理：
 *   - 普通选择器前加 `.island-float `（跳过 body/html/:root/@-规则与已作用域的）；
 *   - @media 递归处理；
 *   - @keyframes 声明与引用统一加 `dsh-i-` 前缀（负向断言避免误伤 .job-spin 这类类名）；
 *   - var(--x) 与 --x: 声明统一改为 --dsh-i-x（CSS 变量全局继承，必须改名）。
 */

const KF = 'dsh-i-'

export function scopeCss(css) {
  let out = css

  // 1) CSS 变量：引用与声明
  out = out.replace(/var\(--(?!dsh-i-)([\w-]+)\)/g, 'var(--dsh-i-$1)')
  out = out.replace(/(--(?!dsh-i-)[\w-]+)\s*:/g, '--dsh-i-$1:')

  // 2) @keyframes 声明改名
  const names = []
  out = out.replace(/@keyframes\s+([\w-]+)/g, (m, name) => {
    names.push(name)
    return `@keyframes ${KF}${name}`
  })

  // 3) 引用改名（animation: NAME 等；避开类名如 .job-spin —— 前置/后置词边界）
  for (const name of names) {
    out = out.replace(new RegExp(`(?<![\\w-])${name}(?![\\w-])`, 'g'), `${KF}${name}`)
  }

  // 4) 选择器作用域化
  out = prefixSelectors(out)
  return out
}

/** 逐规则解析并加作用域前缀（支持 @media 嵌套）。 */
function prefixSelectors(css) {
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
    // 找匹配的右括号（@media / @keyframes 内含嵌套块）
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
      out += prelude + '{' + prefixSelectors(body) + '}'
    } else if (head.startsWith('@')) {
      out += prelude + '{' + body + '}' // @keyframes/@supports 等：保留（keyframes 已改名）
    } else {
      const scoped = prelude.split(',').map(sel => {
        const s = sel.trim()
        if (!s) return sel
        if (/^(body|html|:root|@)/.test(s)) return s // 已有全局作用域（body:not(...) 浅色块等）
        if (s.startsWith('.island-float')) return s // 已作用域（plugin.css 的定位规则）
        return '.island-float ' + s
      }).join(', ')
      out += scoped + '{' + body + '}'
    }
    i = j
  }
  return out
}
