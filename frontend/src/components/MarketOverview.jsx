import { useEffect, useState } from 'react'

export default function MarketOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/insights/market-overview')
      .then(r => {
        if (!r.ok) throw new Error('Market overview unavailable')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="card">
      <div className="card-header"><div className="card-title">Market Pulse</div></div>
      <div className="loading-wrap"><div className="spinner" /></div>
    </div>
  )
  if (error) return (
    <div className="card">
      <div className="card-header"><div className="card-title">Market Pulse</div></div>
      <div className="card-body"><div className="error-banner">⚠️ {error}</div></div>
    </div>
  )
  if (!data) return null

  const avgRet = data.market_avg_return_pct || 0
  const avgReturnColor = avgRet >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
  const total = data.total_stocks || 1
  const advPct = (((data.advancing_stocks || 0) / total) * 100).toFixed(0)

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">Market Pulse</div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{data.trading_date}</span>
      </div>
      <div className="card-body">
        {/* Pulse row */}
        <div className="pulse-row" style={{ marginBottom: '20px' }}>
          <div className="pulse-metric">
            <div className="pulse-label">Market Return</div>
            <div className="pulse-value" style={{ color: avgReturnColor }}>
              {data.market_avg_return_pct >= 0 ? '+' : ''}{data.market_avg_return_pct}%
            </div>
          </div>
          <div className="pulse-metric">
            <div className="pulse-label">Advancing</div>
            <div className="pulse-value" style={{ color: 'var(--accent-green)' }}>
              {data.advancing_stocks}/{data.total_stocks}
            </div>
          </div>
          <div className="pulse-metric">
            <div className="pulse-label">Declining</div>
            <div className="pulse-value" style={{ color: 'var(--accent-red)' }}>
              {data.declining_stocks}/{data.total_stocks}
            </div>
          </div>
          <div className="pulse-metric">
            <div className="pulse-label">Breadth</div>
            <div className="pulse-value" style={{ color: data.advancing_stocks >= data.declining_stocks ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {advPct}%
            </div>
          </div>
        </div>

        {/* Advance/Decline bar */}
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ flex: data.advancing_stocks || 0, background: 'var(--accent-green)', opacity: 0.8 }} />
          <div style={{ flex: data.declining_stocks || 0, background: 'var(--accent-red)', opacity: 0.8 }} />
        </div>

        {/* RSI signals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {(data.overbought_rsi || []).length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-red)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                🔴 RSI Overbought (&gt;70)
              </div>
              {data.overbought_rsi.map(s => (
                <div key={s.symbol} className="insight-row" style={{ marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-red)', minWidth: '60px' }}>
                    {s.display_symbol}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RSI</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-red)' }}>
                    {s.rsi?.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(data.most_volatile || []).length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-amber)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                ⚡ Most Volatile
              </div>
              {data.most_volatile.map(s => (
                <div key={s.symbol} className="insight-row" style={{ marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)', minWidth: '60px' }}>
                    {s.display_symbol}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vol</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                    {(s.volatility_score * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
