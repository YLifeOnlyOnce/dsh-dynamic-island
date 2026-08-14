/**
 * 灵动岛插件，node 半场。
 *
 * 纯 UI 插件：空 apply 让本包出现在宿主 cordis.yml / Loader 里；
 * 浏览器半场经 exports["./client"] 交付，由 package.json 的 dsh.client
 * 声明被发现（与 @deepseek-ai/dsh-client-ui-goal 同构）。
 */

/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply() {}
