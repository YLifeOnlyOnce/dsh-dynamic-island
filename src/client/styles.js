/**
 * 岛样式（Shadow DOM 隔离方案）。
 *
 * - HOST_CSS：唯一注入全局的宿主样式（.dsh-island-host 定位/光标/触摸），
 *   类名命名空间化，与原生零冲突；
 * - SHADOW_CSS：岛全部样式经 transformForShadow 转换后放进 shadow root
 *   的 <style> —— 与原生双向隔离（岛不漏出、原生不漏进）。
 */
import islandCss from '../styles/island.css?inline'
import panelsCss from '../styles/panels.css?inline'
import pluginCss from './island-plugin.css?inline'
import { HOST_CSS, transformForShadow } from '../plugin/shadow-styles.js'

/** 设计变量：定义在 shadow 宿主（:root → :host），向 shadow 内继承。 */
const HOST_VARS = `
:root {
  --shadow: 0 38px 90px rgba(3, 14, 12, .34), 0 2px 2px rgba(4, 13, 11, .22);
}
`

/** shadow 内使用的岛样式（模块求值时转换一次）。 */
export const SHADOW_CSS = transformForShadow([HOST_VARS, islandCss, panelsCss, pluginCss].join('\n'))

let hostInjected = false

/** 幂等注入宿主样式（light DOM，只跑一次）。 */
export function injectHostStyles() {
  if (hostInjected || typeof document === 'undefined') return
  hostInjected = true
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-dynamic-island'
  style.textContent = HOST_CSS
  document.head.append(style)
}

export { HOST_CSS }
