<p align="center">
  <a href="README.md">English</a>
</p>

# DSH 灵动岛

`dsh-dynamic-island` 是一个面向 DeepSeek Harness 的高保真交互原型：用 Apple Liquid Glass 风格的灵动岛，把 Agent 的思考、工具执行、审批、异常和完成状态变成轻量、可读、有一点陪伴感的工作界面。这不是一只与任务无关的桌宠。角色的每一次形态变化都应该来自真实的 Harness 状态，用户始终能知道 Agent 是否在工作、正在做什么、是否需要确认以及任务结果如何。

## 运行

```sh
npm install
npm run dev
```

打开 Vite 输出的本地地址即可查看原型。底部的 `灵动岛演示` 状态栏可以切换五种状态：思考、执行、确认、完成、异常。确认状态中的“批准”和“暂不”会在灵动岛内同步反映审批结果——灵动岛只是 Harness 输入区原生审批卡片的同步镜像操作入口，不驱动底层任务状态。

## 设计决策

- **Companion Island**：平时收缩为状态点，发生任务事件时以带回弹的玻璃形态扩展。
- **状态优先**：角色的表情、核心光源、边缘色和文本共同表达状态，不用动画伪造模型思考过程。
- **低打扰**：只有任务发生关键变化时才扩展；完成后留下短暂收据，再恢复为安静的状态点。
- **可访问**：支持 `prefers-reduced-motion`，状态不依赖颜色单独表达，审批保留可操作的文字按钮。
- **性能**：主要动画使用 `transform`、`opacity` 和受控的宽度过渡；后续正式实现应避免持续动画大面积 `backdrop-filter`。

## 与 DSH 的事件映射

本地 Harness 工程的架构文档确认了以下边界。正式插件应将 Host 侧事件转为一个窄的、可版本化的客户端状态协议，而不是让组件直接消费全部会话事件。

| Companion 状态 | DSH 信号 | 视觉行为 |
|---|---|---|
| `thinking` | `agent/status: running`、`step/start`、LLM 流开始 | 核心呼吸，胶囊显示当前任务和步骤 |
| `working` | `session/event: tool/call`，等待对应 `tool/result` | 青绿色执行脉冲，显示工具名和进度 |
| `approval` | 用户审批事件 / 审批 composer 待处理状态 | 暖珊瑚边缘，扩展出批准/暂不动作 |
| `complete` | `turn/end` 后的成功状态 | 轻微折射高光，展示任务结果收据 |
| `alert` | `tool/result` error、`agent/request-error` | 橙红色停顿，提示失败摘要和处理入口 |

持久化与回放优先读取 `session/event`；实时交互优先读取 `agent/*` 信号。正式实现还需要确认当前版本允许的 client slot/connection 注入点，并为没有活动会话、事件流断开、多个会话并行和 HMR 重载补充状态规则。

## 目录

```text
src/App.jsx       # 原型应用与本地状态流转
src/App.css       # 玻璃材质、灵动岛动效和响应式布局
src/index.css     # 基础字体和全局重置
```

这是设计验证用的独立目录，不会修改本地 DeepSeek Harness 源码。
