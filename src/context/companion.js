import { createContext, useContext } from 'react'

/**
 * Companion 全局状态上下文。
 *
 * 由 App 用 useCompanionState() 计算后通过 Provider 注入，
 * 岛内组件与界面 chrome 组件各自按需取用，避免逐层透传十几条 props。
 */
export const CompanionContext = createContext(null)

/** 读取 Companion 状态与动作；必须在 <CompanionContext.Provider> 内使用。 */
export function useCompanion() {
  const ctx = useContext(CompanionContext)
  if (!ctx) {
    throw new Error('useCompanion must be used within CompanionContext.Provider')
  }
  return ctx
}
