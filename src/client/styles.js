/**
 * 岛样式注入：插件构建里把 CSS 以字符串内联（?inline），
 * 在工厂执行时注入 <style data-plugin="dsh-dynamic-island">。
 * 与仓库内 tsdown 配方的行为对齐 —— 卸载时由 loader 移除同名 style 标签。
 *
 * 关键：注入前对全部 CSS 做**作用域化**（scopeCss）——所有选择器只匹配
 * `.island-float` 内部、keyframes 与 CSS 变量改名加前缀。这样岛的样式
 * 绝不会泄漏到原生界面（.button / .status-dot / .recent 等通用类名不会再
 * 命中原生输入栏的 DOM），原生界面也得不到岛的任何样式。
 */
import islandCss from '../styles/island.css?inline'
import panelsCss from '../styles/panels.css?inline'
import pluginCss from './island-plugin.css?inline'
import { scopeCss } from '../plugin/scope-css.js'

/** 设计变量（base.css 的 :root 块；注入时统一改为 --dsh-i-* 前缀，避免污染原生变量）。 */
const ROOT_VARS = `
:root {
  --dsh-i-canvas: #15201e;
  --dsh-i-ink: #eff7f2;
  --dsh-i-muted: #9eaca5;
  --dsh-i-line: rgba(224, 246, 234, .12);
  --dsh-i-glass: rgba(232, 247, 240, .14);
  --dsh-i-glass-strong: rgba(226, 248, 238, .2);
  --dsh-i-shadow: 0 38px 90px rgba(3, 14, 12, .34), 0 2px 2px rgba(4, 13, 11, .22);
}
`

let injected = false

/** 幂等注入作用域化后的岛样式（只跑一次）。 */
export function injectIslandStyles() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-dynamic-island'
  style.textContent = scopeCss([ROOT_VARS, islandCss, panelsCss, pluginCss].join('\n'))
  document.head.append(style)
}
