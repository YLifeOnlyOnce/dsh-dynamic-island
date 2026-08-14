import { defineStore } from '@deepseek-ai/dsh-client-runtime/client'

/**
 * 岛的状态 store（register 的 store 座位）。
 *
 * 契约（runtime 的 SlotRegistry.resolveStore）：框架调用 `handle.create()`
 * 实例化 store，再交付 `useStore` 与 baked `actions`（注入工厂也收到 actions）。
 * 所以这里必须返回**完整 StoreHandle** —— 用运行时引擎 `defineStore`
 * 构造（ui-layout 同款），不能手写 `{ spec }` 残缺对象（那会在
 * resolveStore 处抛 `handle.create is not a function`，条目被错误边界吞掉）。
 *
 * 状态只装两样东西：当前会话 id 与派生出的岛模型（协议层输出）。
 * 组件侧 UI 状态（展开/过程/清单/审批反馈）留在 IslandDock 的本地 state。
 */
export function createIslandStore() {
  return defineStore({
    init: () => ({ sessionId: undefined, model: null }),
    actions: {
      /** 当前会话变化（由 live-bridge 在 info 变化时调用）。 */
      setSession(d, sessionId) {
        d.sessionId = sessionId
      },
      /** 岛模型更新（协议层 deriveMood 的输出）。 */
      setModel(d, model) {
        d.model = model
      },
    },
  })
}
