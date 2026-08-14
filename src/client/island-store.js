/**
 * 岛的状态 store（register 的 store 座位）。
 *
 * 契约（ui-slots/src/store.ts）：StoreFactory = () => StoreHandle，
 * StoreHandle.spec = { init, actions }；框架按 entry 实例化后把
 * `useStore` 与 baked `actions` 交给组件，并把 actions 传进 register
 * 的 inject 工厂 —— 非 React 订阅（live-bridge）就是经这条通道回写状态。
 *
 * 状态只装两样东西：当前会话 id 与派生出的岛模型（协议层输出）。
 * 组件侧 UI 状态（展开/过程/清单/审批反馈）留在 IslandDock 的本地 state。
 */
export function createIslandStore() {
  return {
    spec: {
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
    },
  }
}
