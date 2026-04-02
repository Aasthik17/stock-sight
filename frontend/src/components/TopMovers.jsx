import { useEffect, useState } from 'react'

export default function TopMovers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/insights/top-movers')
      .then(r => {
        if (!r.ok) throw new Error('Top movers data unavailable')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="card">
      <div className="card-header"><div className="card-title">Top Movers</div></div>
      <div className="loading-wrap"><div className="spinner" /></div>
    </div>
  )
  if (error) return (
    <div className="card">
      <div className="card-header"><div className="card-title">Top Movers</div></div>
      <div className="card-body"><div className="error-banner">⚠️ {error}</div></div>
    </div>
  )

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">Top Movers <span className="tag tag-amber" style={{ marginLeft: 6 }}>Today</span></div>
        {data?.trading_date && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{data.trading_date}</span>
        )}
      </div>
      <div className="card-body">
        <div className="movers-grid">
          {/* Gainers */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ▲ Top Gainers
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(data?.top_gainers || []).map(m => (
                <div key={m.symbol} className="mover-item gainer">
                  <div className="mover-left">
                    <span className="mover-symbol">{m.display_symbol}</span>
                    <span className="mover-name">{m.name}</span>
                  </div>
                  <div className="mover-right">
                    <div className="mover-return">+{m.daily_return_pct.toFixed(2)}%</div>
                    <div className="mover-close">₹{m.close.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Losers */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-red)', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ▼ Top Losers
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(data?.top_losers || []).map(m => (
                <div key={m.symbol} className="mover-item loser">
                  <div className="mover-left">
                    <span className="mover-symbol">{m.display_symbol}</span>
                    <span className="mover-name">{m.name}</span>
                  </div>
                  <div className="mover-right">
                    <div className="mover-return">{m.daily_return_pct.toFixed(2)}%</div>
                    <div className="mover-close">₹{m.close.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
