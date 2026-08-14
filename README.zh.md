<div align="center">

<img src="public/favicon.svg" width="72" alt="DSH 灵动岛 logo" />

# 🛰️ DSH 灵动岛

**给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的一只小玻璃伙伴——Agent 思考时它轻轻呼吸，干活时它微微脉动，要动你的东西之前，它还会先礼貌地问你一声。**

🍎 Liquid Glass 质感 · 🌱 零额外依赖 · 👀 时刻知道你的 Agent 在干嘛

[English](README.md) · [MIT](LICENSE)

</div>

---

> **状态：高保真设计原型** —— 为 DeepSeek Harness 设计、打磨、验证灵动岛形态的地方，之后才会变成真正的插件。⭐ 点个 Star，让这座小岛留在你的轨道上。

---

## 🪟 岛在工作区里的样子

| 安静地趴在角落 | 需要你时弹开 | 完成后留张小收据 |
|---|---|---|
| <img src="public/screens/island-1.png" width="320" alt="工作区上的灵动岛" /> | <img src="public/screens/island-2.png" width="320" alt="展开的灵动岛" /> | <img src="public/screens/island-3.png" width="320" alt="任务完成后的灵动岛" /> |

小岛平时安静地待在工作区角落。一旦你的 Agent 开始做值得你知道的事——思考、跑工具、等你批准、或者碰了钉子——它就立刻活过来。

## 🧭 这是什么？

`dsh-dynamic-island` 是为 DeepSeek Harness 打造的苹果 **Liquid Glass** 风格灵动岛概念原型：把 Agent 的内心活动——思考、工具调用、审批、异常、完成——变成一块轻量、可读、带一点点陪伴感的小屏幕，趴在你屏幕的边缘。

它**不是**一只和任务无关的桌宠。每一次形态变化都来自真实的 Harness 状态：你永远知道 Agent 有没有在干活、在干什么、要不要你拍板、任务最后怎么样了。

## ✨ 你会喜欢它的理由

- 🍬 **货真价实的 Liquid Glass** —— 层层通透、带弹性的形态、会动的光。全部手写 CSS，不用任何 UI 库。
- 🎯 **状态优先，始终如一** —— 小伙伴的表情、核心光源、边缘色和文字说的是同一件事。绝不用假动画假装"AI 在思考"。
- 🤫 **低打扰设计** —— 没事就缩成一个小点。任务完成时留下一张小收据，然后安静回去。
- 🛡️ **尊重你的决定** —— 审批镜像 Harness 原生输入区：灵动岛只是第二个同步操作入口，绝不会自己替 Harness 做决定。
- ♿ **无障碍、有礼貌** —— 尊重 `prefers-reduced-motion`，不单靠颜色表达状态，审批按钮永远是真实可点的按钮。
- 🌱 **零运行时依赖** —— React + 一点点 CSS，仅此而已。

## 🎨 五种心情

| 心情 | 感觉 | 色调 |
|---|---|---|
| 🧠 思考 | 核心轻轻呼吸；胶囊显示当前任务和步骤 | aqua |
| 🛠️ 执行 | 青绿脉冲——工具名和进度实时显示 | mint |
| 🫵 确认 | 暖珊瑚边缘——展开真实的「批准 / 暂不」按钮 | coral |
| ✅ 完成 | 一抹柔和的折射高光 + 一张小小的结果收据 | lime |
| ⚠️ 异常 | 橙色停顿——失败摘要和回到正轨的入口 | amber |

## 🔌 它怎么和 DeepSeek Harness 对话

概念上把每一条 Harness 信号映射成一种岛的心情——一个窄的、可版本化的客户端状态协议，而不是一头扎进原始事件流：

| 岛的心情 | DSH 信号 |
|---|---|
| `thinking` | `agent/status: running`、`step/start`、LLM 流开始 |
| `working` | `session/event: tool/call` → 对应的 `tool/result` |
| `approval` | 输入区有待处理的审批 |
| `complete` | `turn/end` 成功结束 |
| `alert` | `tool/result` error、`agent/request-error` |

> 回放与持久化读 `session/event`；实时交互读 `agent/*`。正式插件还需要敲定当前版本允许的 client slot/connection 注入点——以及没有活动会话、事件流断开、多会话并行、HMR 重载这些边角规则。这些都在[路线图](#-路线图)上。

## 🚀 跑起来

```sh
npm install
npm run dev
```

打开 Vite 打印的地址——底部 `灵动岛演示` 栏可以切换五种心情。在**确认**状态点「批准 / 暂不」，看小岛瞬间同步反映结果。

## 🧱 技术栈

- **React 19** + **Vite 8** —— 简洁快速
- **纯手写 CSS** —— 每一块玻璃、每一条轨道、每一次呼吸都是定制的
- **零 UI 框架** —— 重点是验证设计，不是炫技

## 🗺️ 路线图

- [x] 五种状态的 Liquid Glass 灵动岛
- [x] 同步的审批操作（原生输入区的镜像）
- [ ] Agent 写作时的流式输出预览
- [ ] 工具命令卡片（退出码、耗时、复制）
- [ ] 结果收据（改了几个文件、过了几个检查）
- [ ] 真正的 `dsh-dynamic-island` 插件 🚀

## 💛 让小岛留在轨道上

如果它让你会心一笑，点个 ⭐ —— 这是把设计原型变成真正插件的燃料。Issues、想法、"为什么还不支持 XXX" 统统欢迎。

为 DeepSeek Harness 社区，用 🫶 建造。
