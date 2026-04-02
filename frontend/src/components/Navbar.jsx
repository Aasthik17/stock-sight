import { CalendarDays, Clock3, Sparkles, TrendingUp } from 'lucide-react'

const COPY = {
  dashboard: {
    eyebrow: 'Overview',
    title: 'Welcome back to StockSight',
    description: 'Monitor blue-chip momentum, breadth, and market structure from one workspace.',
  },
  stock: {
    eyebrow: 'Stock Detail',
    title: 'Deep-dive on the selected company',
    description: 'Interactive charting, 52-week context, RSI momentum, and prediction panels.',
  },
  compare: {
    eyebrow: 'Compare',
    title: 'Relative performance and correlation',
    description: 'Line up two NSE names to inspect normalized returns and volatility side by side.',
  },
}

export default function Navbar({ activeTab, selectedSymbol, selectedCompany }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
  const copy = COPY[activeTab]
  const selectedLabel = selectedCompany ? `${selectedCompany.display_symbol} · ${selectedCompany.sector}` : null

  return (
    <header className="navbar">
      <div className="navbar-copy">
        <div className="navbar-eyebrow">
          <Sparkles size={14} strokeWidth={1.8} />
          {copy.eyebrow}
        </div>
        <div className="navbar-title-row">
          <h1 className="navbar-title">{copy.title}</h1>
          {activeTab === 'stock' && selectedSymbol && (
            <span className="header-chip accent">
              <TrendingUp size={14} strokeWidth={1.8} />
              {selectedSymbol.replace('.NS', '')}
            </span>
          )}
        </div>
        <p className="navbar-description">{copy.description}</p>
      </div>

      <div className="navbar-right">
        {selectedLabel && (
          <div className="header-chip">
            <TrendingUp size={14} strokeWidth={1.8} />
            {selectedLabel}
          </div>
        )}
        <div className="header-chip">
          <CalendarDays size={14} strokeWidth={1.8} />
          {dateStr}
        </div>
        <div className="header-chip accent">
          <Clock3 size={14} strokeWidth={1.8} />
          {timeStr} IST
        </div>
      </div>
    </header>
  )
}
