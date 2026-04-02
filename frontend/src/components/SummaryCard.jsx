import { useEffect, useState } from 'react'

function RSIBar({ rsi }) {
  if (!rsi) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
  const pct = Math.min(100, Math.max(0, rsi))
  const cls = rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
  const label = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'
  return (
    <div className="rsi-indicator">
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: rsi > 70 ? 'var(--accent-red)' : rsi < 30 ? 'var(--accent-green)' : 'var(--accent-blue)' }}>{rsi.toFixed(1)}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{label}</span>
      </div>
      <div className="rsi-bar-track">
        <div className={`rsi-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="rsi-labels"><span>0</span><span>30</span><span>70</span><span>100</span></div>
    </div>
  )
}

export default function SummaryCard({ symbol }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setError(null)
    fetch(`/api/summary/${encodeURIComponent(symbol)}`)
      .then(r => {
        if (!r.ok) throw new Error('Summary data unavailable')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [symbol])

  if (!symbol) return null

  const displaySym = symbol.replace('.NS', '')

  if (loading) return (
    <div className="card">
      <div className="card-header"><div className="card-title">{displaySym} Summary</div></div>
      <div className="loading-wrap"><div className="spinner" /></div>
    </div>
  )
  if (error) return (
    <div className="card">
      <div className="card-header"><div className="card-title">{displaySym} Summary</div></div>
      <div className="card-body"><div className="error-banner">⚠️ {error}</div></div>
    </div>
  )
  if (!data) return null

  const retPct = data.latest_daily_return_pct
  const retClass = retPct > 0 ? 'positive' : retPct < 0 ? 'negative' : ''

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">
          {displaySym} Summary
          <span className={`tag ${retPct >= 0 ? 'tag-green' : 'tag-red'}`} style={{ marginLeft: 8 }}>
            {retPct >= 0 ? '▲' : '▼'} {Math.abs(retPct).toFixed(2)}% today
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {data.data_start} → {data.data_end}
        </span>
      </div>
      <div className="card-body">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Current Price</div>
            <div className="stat-value blue">₹{data.latest_close?.toLocaleString('en-IN')}</div>
            <div className="stat-sub">{data.total_trading_days} days tracked</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">52-Week High</div>
            <div className="stat-value positive">₹{data.week52_high?.toLocaleString('en-IN')}</div>
            <div className="stat-sub">Yearly peak</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">52-Week Low</div>
            <div className="stat-value negative">₹{data.week52_low?.toLocaleString('en-IN')}</div>
            <div className="stat-sub">Yearly trough</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Close (52W)</div>
            <div className="stat-value amber">₹{data.avg_close?.toLocaleString('en-IN')}</div>
            <div className="stat-sub">Mean price</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Return</div>
            <div className={`stat-value ${retClass}`}>
              {retPct >= 0 ? '+' : ''}{retPct?.toFixed(2)}%
            </div>
            <div className="stat-sub">Avg: {data.avg_daily_return_pct?.toFixed(3)}% / day</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Volatility Score</div>
            <div className="stat-value purple">
              {data.latest_volatility_score ? (data.latest_volatility_score * 100).toFixed(1) + '%' : '—'}
            </div>
            <div className="stat-sub">Annualised std dev</div>
          </div>
        </div>

        {/* RSI Section */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            RSI-14 Momentum
          </div>
          <RSIBar rsi={data.latest_rsi} />
        </div>
      </div>
    </div>
  )
}
