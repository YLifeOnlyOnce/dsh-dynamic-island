/**
 * 结果小票 —— 对应 turn/end.reason + assistant/message.usage（tokens 统计）。
 * 只渲染**有值**的统计项：live 模式下 files/checks 尚无数据源时为 undefined，
 * 自动隐藏，绝不显示空白条目。
 */
export function ReceiptStats({ receipt }) {
  const fmt = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
  const stats = [
    receipt.files != null && { b: receipt.files, label: '文件' },
    receipt.checks != null && { b: receipt.checks, label: '检查' },
    receipt.tokens?.output != null && receipt.tokens.output > 0 && { b: fmt(receipt.tokens.output), label: '输出 tokens' },
    receipt.tokens?.cache != null && receipt.tokens.cache > 0 && { b: fmt(receipt.tokens.cache), label: '缓存命中' },
    receipt.duration && { b: receipt.duration, label: '用时' },
  ].filter(Boolean)

  if (stats.length === 0) return null

  return (
    <div className="receipt-strip" aria-label="任务结果统计">
      {stats.map((s, i) => (
        <span key={i}><b>{s.b}</b> {s.label}</span>
      ))}
    </div>
  )
}
