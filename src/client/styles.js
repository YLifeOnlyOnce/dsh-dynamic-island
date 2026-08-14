/**
 * 岛样式注入：插件构建里把 CSS 以字符串内联（?inline），
 * 在工厂执行时注入 <style data-plugin="dsh-dynamic-island">。
 * 与仓库内 tsdown 配方的行为对齐 —— 卸载时由 loader 移除同名 style 标签。
 */
import islandCss from '../styles/island.css?inline'
import panelsCss from '../styles/panels.css?inline'
import pluginCss from './island-plugin.css?inline'

/** 设计变量（base.css 的 :root 块，插件不需要 demo 的 workspace/topbar 等）。 */
const ROOT_VARS = `
:root {
  --canvas: #15201e;
  --ink: #eff7f2;
  --muted: #9eaca5;
  --line: rgba(224, 246, 234, .12);
  --glass: rgba(232, 247, 240, .14);
  --glass-strong: rgba(226, 248, 238, .2);
  --shadow: 0 38px 90px rgba(3, 14, 12, .34), 0 2px 2px rgba(4, 13, 11, .22);
}
`

let injected = false

/** 幂等注入岛样式（只跑一次）。 */
export function injectIslandStyles() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-dynamic-island'
  style.textContent = [ROOT_VARS, islandCss, panelsCss, pluginCss].join('\n')
  document.head.append(style)
}
