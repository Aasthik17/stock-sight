import { useEffect, useState } from 'react'
import { apiUrl } from '../lib/api'

export default function PredictionChart({ symbol }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!symbol || !expanded) return
    setLoading(true)
    setError(null)
    fetch(apiUrl(`/predict/${encodeURIComponent(symbol)}`))
      .then(r => {
        if (!r.ok) throw new Error('Prediction model unavailable')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [symbol, expanded])

  if (!symbol) return null

  const displaySym = symbol.replace('.NS', '')

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">
          ML Price Prediction
          <span className="tag tag-purple" style={{ marginLeft: 8 }}>LinearRegression</span>
        </div>
        <button
          id={`predict-toggle-${displaySym}`}
          className="compare-btn"
          style={{ fontSize: '12px', padding: '6px 14px' }}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? 'Hide model' : 'Run model'}
        </button>
      </div>
      <div className="card-body">
        {!expanded && (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-icon">🔮</div>
            <div className="empty-desc">
              Run a 7-day forward price prediction for <strong style={{ color: 'var(--text-primary)' }}>{displaySym}</strong> using a LinearRegression model trained on 60-day price history.
            </div>
          </div>
        )}
        {expanded && loading && <div className="loading-wrap"><div className="spinner" /></div>}
        {expanded && error && <div className="error-banner">⚠️ {error}</div>}
        {expanded && data && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Latest Close</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹{data.latest_close?.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Model</div>
                <div style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 600 }}>{data.model}</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              7-Day Forecast
            </div>
            <div className="prediction-band">
              {data.predictions?.map((p, i) => {
                const diff = p.predicted_close - data.latest_close
                const isUp = diff >= 0
                return (
                  <div key={p.date} className="pred-chip">
                    <span className="pred-date">
                      {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="pred-price">₹{p.predicted_close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span style={{ fontSize: '9px', color: isUp ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                      {isUp ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="error-banner" style={{ marginTop: '14px', fontSize: '11px', background: 'rgba(234,234,234,0.1)', borderColor: 'rgba(234,234,234,0.16)', color: 'var(--accent-purple)' }}>
              ⚠️ {data.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
