/** 结果小票 —— 对应 turn/end.reason + assistant/message.usage（tokens 统计）。 */
export function ReceiptStats({ receipt }) {
  const fmt = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
  return (
    <div className="receipt-strip" aria-label="任务结果统计">
      <span><b>{receipt.files}</b> 文件</span>
      <span><b>{receipt.checks}</b> 检查</span>
      <span><b>{fmt(receipt.tokens.output)}</b> 输出 tokens</span>
      <span><b>{fmt(receipt.tokens.cache)}</b> 缓存命中</span>
      <span><b>{receipt.duration}</b> 用时</span>
    </div>
  )
}
