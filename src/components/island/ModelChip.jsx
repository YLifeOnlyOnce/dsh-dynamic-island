/** 模型徽章 —— 对应 request/context（provider · model）。 */
export function ModelChip({ model }) {
  return (
    <span className="model-chip" title="request/context · provider/model">{model}</span>
  )
}
