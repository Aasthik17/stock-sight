import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { apiUrl } from '../lib/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const NSE_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'BAJFINANCE.NS', 'HINDUNILVR.NS', 'ITC.NS', 'KOTAKBANK.NS', 'LT.NS',
  'AXISBANK.NS', 'MARUTI.NS', 'NESTLEIND.NS', 'SUNPHARMA.NS', 'WIPRO.NS',
]

export default function CompareView() {
  const [sym1, setSym1] = useState('TCS.NS')
  const [sym2, setSym2] = useState('INFY.NS')
  const [days, setDays] = useState(90)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = () => {
    setLoading(true)
    setError(null)
    setData(null)
    fetch(apiUrl(`/compare?symbol1=${sym1}&symbol2=${sym2}&days=${days}`))
      .then(r => {
        if (!r.ok) throw new Error('Correlation analysis failed')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  const stockKeys = data ? Object.keys(data.stocks) : []
  const s1key = stockKeys[0]
  const s2key = stockKeys[1]

  const chartData = data
    ? {
        labels: data.chart_data.dates.map(d =>
          new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        ),
        datasets: [
          {
            label: s1key?.replace('.NS', ''),
            data: data.chart_data.series1_normalised,
            borderColor: '#f0a339',
            backgroundColor: 'rgba(240,163,57,0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: s2key?.replace('.NS', ''),
            data: data.chart_data.series2_normalised,
            borderColor: '#68c98b',
            backgroundColor: 'rgba(104,201,139,0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          },
        ],
      }
    : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: 'rgba(196,193,184,0.9)', font: { size: 11 }, boxWidth: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(22,20,18,0.98)',
        borderColor: 'rgba(235,211,165,0.18)',
        borderWidth: 1,
        titleColor: '#f5efe3',
        bodyColor: '#c5bcaf',
        padding: 12,
        callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} (base=100)` },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: 'rgba(181,174,162,0.72)', font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(181,174,162,0.72)', font: { size: 10 } },
        position: 'right',
      },
    },
  }

  const corr = data?.correlation
  const corrClass = corr !== undefined ? (corr > 0.7 ? 'corr-high' : corr > 0.3 ? 'corr-medium' : 'corr-low') : ''
  const corrLabel = corr !== undefined ? (corr > 0.7 ? 'High correlation' : corr > 0.3 ? 'Medium correlation' : 'Low correlation') : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card fade-in">
        <div className="card-header">
          <div className="card-title">Stock Comparison</div>
        </div>
        <div className="card-body">
          <div className="compare-selectors">
            <select
              id="compare-select-1"
              className="compare-select"
              value={sym1}
              onChange={e => setSym1(e.target.value)}
            >
              {NSE_SYMBOLS.map(s => (
                <option key={s} value={s}>{s.replace('.NS', '')}</option>
              ))}
            </select>
            <span className="compare-vs">VS</span>
            <select
              id="compare-select-2"
              className="compare-select"
              value={sym2}
              onChange={e => setSym2(e.target.value)}
            >
              {NSE_SYMBOLS.map(s => (
                <option key={s} value={s}>{s.replace('.NS', '')}</option>
              ))}
            </select>

            <div className="period-selector">
              {[30, 60, 90, 180, 365].map(d => (
                <button
                  key={d}
                  className={`period-btn${days === d ? ' active' : ''}`}
                  onClick={() => setDays(d)}
                >
                  {d}D
                </button>
              ))}
            </div>

            <button id="compare-run-btn" className="compare-btn" onClick={run} disabled={loading}>
              {loading ? 'Comparing...' : 'Run comparison'}
            </button>
          </div>

          {loading && <div className="loading-wrap" style={{ paddingTop: '32px' }}><div className="spinner" /></div>}
          {error && <div className="error-banner" style={{ marginTop: '16px' }}>⚠️ {error}</div>}

          {data && (
            <div style={{ marginTop: '20px' }} className="fade-in">
              {/* Correlation badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pearson Correlation:</span>
                <span className={`corr-badge ${corrClass}`}>
                  {corr?.toFixed(4)} · {corrLabel}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  over {data.common_trading_days} trading days
                </span>
              </div>

              {/* Stats columns */}
              <div className="compare-stats">
                {stockKeys.map((sk, i) => {
                  const st = data.stocks[sk]
                  return (
                    <div key={sk} className={`compare-stat-col s${i + 1}`}>
                      <h4>{sk.replace('.NS', '')}</h4>
                      {[
                        ['Period Return', `${st.period_return_pct >= 0 ? '+' : ''}${st.period_return_pct}%`],
                        ['Ann. Volatility', `${st.annualised_volatility_pct}%`],
                        ['Start Price', `₹${st.start_price.toLocaleString('en-IN')}`],
                        ['End Price', `₹${st.end_price.toLocaleString('en-IN')}`],
                      ].map(([label, val]) => (
                        <div key={label} className="compare-row">
                          <span className="compare-row-label">{label}</span>
                          <span className="compare-row-val" style={{ color: label === 'Period Return' ? (st.period_return_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-primary)' }}>
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Normalised chart */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  Normalised price performance (Base = 100)
                </div>
                <div className="chart-container-tall">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
