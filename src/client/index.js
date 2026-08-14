/**
 * 灵动岛插件，浏览器半场：把岛挂进 Web GUI 的 shell.overlay 浮层槽。
 *
 * 挂载点（已对照源码核实）：ui-layout 声明的 'shell.overlay'
 * { kind: 'list'; scope: 'root' } 全屏浮层槽（z-index 20、点击穿透、
 * 条目自选接收指针事件），注释明示是给 badge/toast/状态胶囊/自研全屏
 * 表面预留的加性座位，目前零注册者。
 *
 * 数据流：apply(ctx) 里建实时桥（订阅 ctx.sessions.currentProvideInfo
 * → 快照 + 投影 → 协议层 deriveMood → store actions），store 经 register
 * 的 store 座位交付组件；组件读 useStore 拿岛模型。整条链路不依赖
 * 任何仓库私有运行时导出 —— 只用平台模块表词（react、web-react）。
 */
import { IslandDock } from './IslandDock.jsx'
import { createIslandStore } from './island-store.js'
import { createLiveBridge } from './live-bridge.js'
import { en, NS, zh } from './locales.js'

/** 需要的服务：插槽、会话服务、本地化、模型目录。 */
export const inject = ['slots', 'sessions', 'locale', 'modelDirectories']

/**
 * 客户端插件主体：注册字典 + 把岛挂进 shell.overlay。
 * @param ctx - 客户端根上下文（cordis 注入）。
 */
export function apply(ctx) {
  // 宿主样式由 IslandDock 挂载时注入（shadow root 内放岛样式）
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-island: dictionaries')

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'dynamic-island',
    // 浮层条目按 order 自排序：靠后的显示在上层。
    order: 100,
    locale: NS,
    // 专属 store：框架按 entry 实例化，组件经 useStore 读取。
    store: createIslandStore,
    // 桥回接：拿到 baked actions 后开始订阅实时状态；返回的动作面成为组件 props。
    inject: actions => {
      const bridge = createLiveBridge(ctx, actions)
      ctx.effect(() => bridge.stop, 'ui-island: live-bridge teardown')
      return { islandActions: bridge.verbs }
    },
  }, IslandDock))
}
