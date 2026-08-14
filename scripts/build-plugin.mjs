#!/usr/bin/env node
/**
 * 构建浏览器半场 bundle（lib/client.js）。
 *
 * 产出形状与 deepseek-harness 的客户端插件完全一致（对照源码核实）：
 *   window.__ModuleLoader__.load({ id, factory })
 *   factory: (require) => exports
 *   require 只对「平台模块表」解析（packages/client/web/src/seed.ts 的 10 个词）。
 *
 * 实现：Vite lib 模式（cjs、extern = 平台表）→ generateBundle 把 chunk
 * 改写成闭包工厂。CSS 经 ?inline 内联成字符串，工厂执行时注入
 * <style data-plugin="dsh-dynamic-island">（与仓库 tsdown 配方行为一致）。
 */
import { build } from 'vite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 平台模块表（packages/client/web/src/seed.ts）—— bundle 的 extern 只对这张表解析。 */
const PLATFORM_WORDS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
]

const PLUGIN_ID = 'dsh-dynamic-island'

/** 把 rollup 产出的 cjs chunk 改写成 loader 闭包工厂。 */
function moduleLoaderWrapper() {
  return {
    name: 'dsh-module-loader-wrapper',
    generateBundle(_opts, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk') continue
        let code = file.code
        code = code.replace(/^\s*'use strict';\s*/, '')
        file.code = [
          `window.__ModuleLoader__.load({`,
          `  id: ${JSON.stringify(PLUGIN_ID)},`,
          `  factory: function (require) {`,
          `    'use strict';`,
          `    var module = { exports: {} };`,
          `    var exports = module.exports;`,
          code,
          `    return module.exports;`,
          `  }`,
          `});`,
        ].join('\n')
      }
    },
  }
}

mkdirSync(resolve(root, 'lib'), { recursive: true })

await build({
  root,
  configFile: false,
  logLevel: 'info',
  plugins: [moduleLoaderWrapper()],
  publicDir: false,
  build: {
    outDir: resolve(root, 'lib'),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(root, 'src/client/index.js'),
      formats: ['cjs'],
      fileName: () => 'client.js',
    },
    rollupOptions: {
      external: PLATFORM_WORDS,
      output: { exports: 'named' },
    },
  },
})
