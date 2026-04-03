import { useEffect, useState, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { apiUrl } from '../lib/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '60D', days: 60 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
]

export default function StockChart({ symbol, companyInfo }) {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showMA, setShowMA] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setError(null)
    fetch(apiUrl(`/data/${encodeURIComponent(symbol)}?days=${period}`))
      .then(r => {
        if (!r.ok) throw new Error('Real-time data unavailable')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [symbol, period])

  if (!symbol) return null

  const displaySym = symbol.replace('.NS', '')

  const chartData = data?.data || []
  const labels = chartData.map(d => {
    const dt = new Date(d.date)
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  })
  const closes = chartData.map(d => d.close)
  const ma7s = chartData.map(d => d.ma7)
  const ma20s = chartData.map(d => d.ma20)

  const firstClose = closes[0] || 0
  const lastClose = closes[closes.length - 1] || 0
  const isUp = lastClose >= firstClose

  const chartConfig = {
    labels,
    datasets: [
      {
        label: 'Close Price',
        data: closes,
        borderColor: isUp ? '#34D399' : '#F2C75B',
        backgroundColor: isUp
          ? 'rgba(52, 211, 153, 0.08)'
          : 'rgba(242, 199, 91, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: isUp ? '#34D399' : '#F2C75B',
      },
      ...(showMA ? [
        {
          label: 'MA7',
          data: ma7s,
          borderColor: 'rgba(242, 199, 91, 0.82)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          fill: false,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'MA20',
          data: ma20s,
          borderColor: 'rgba(234, 234, 234, 0.82)',
          borderWidth: 1.5,
          borderDash: [6, 3],
          fill: false,
          tension: 0.3,
          pointRadius: 0,
        },
      ] : []),
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: showMA,
        labels: {
          color: 'rgba(234, 234, 234, 0.9)',
          font: { size: 11, family: 'Manrope' },
          boxWidth: 20,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(34, 34, 34, 0.98)',
        borderColor: 'rgba(234, 234, 234, 0.14)',
        borderWidth: 1,
        titleColor: '#EAEAEA',
        bodyColor: '#D4D4D4',
        padding: 12,
        callbacks: {
          label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(234,234,234,0.06)', drawBorder: false },
        ticks: { color: 'rgba(212,212,212,0.75)', font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(234,234,234,0.08)', drawBorder: false },
        ticks: {
          color: 'rgba(212,212,212,0.75)',
          font: { size: 10, family: 'JetBrains Mono' },
          callback: v => '₹' + v.toLocaleString('en-IN'),
        },
        position: 'right',
      },
    },
  }

  const changePct = firstClose ? ((lastClose - firstClose) / firstClose * 100).toFixed(2) : 0

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">
          {displaySym} · {companyInfo?.name || ''}
          <span className={`tag ${isUp ? 'tag-green' : 'tag-red'}`} style={{ marginLeft: 8 }}>
            {isUp ? '▲' : '▼'} {Math.abs(changePct)}% ({PERIODS.find(p => p.days === period)?.label})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowMA(!showMA)}
            className="period-btn"
            style={{ fontSize: '11px', border: `1px solid ${showMA ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, borderRadius: '5px', padding: '4px 10px' }}
          >
            MA Lines
          </button>
          <div className="period-selector">
            {PERIODS.map(p => (
              <button
                key={p.days}
                id={`period-btn-${p.label}`}
                className={`period-btn${period === p.days ? ' active' : ''}`}
                onClick={() => setPeriod(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="card-body">
        {loading && <div className="loading-wrap"><div className="spinner" /></div>}
        {error && <div className="error-banner">⚠️ {error}</div>}
        {!loading && !error && (
          <div className="chart-container-tall">
            <Line data={chartConfig} options={options} />
          </div>
        )}
      </div>
    </div>
  )
}
