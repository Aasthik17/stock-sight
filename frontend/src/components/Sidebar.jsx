import { useState, useEffect } from 'react'
import { BarChart3, CandlestickChart, ChevronsUpDown, LayoutGrid, Scale, Search } from 'lucide-react'

const SECTORS = ['All', 'IT', 'Banking', 'FMCG', 'Energy', 'NBFC', 'Infrastructure', 'Automobile', 'Pharma']
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', description: 'Market dashboard', icon: LayoutGrid },
  { id: 'stock', label: 'Stock Detail', description: 'Selected symbol', icon: CandlestickChart },
  { id: 'compare', label: 'Compare', description: 'Relative analysis', icon: Scale },
]

export default function Sidebar({ activeTab, onTabChange, selectedSymbol, onSelectSymbol }) {
  const [companies, setCompanies] = useState([])
  const [movers, setMovers] = useState(null)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companies')
      .then(r => {
        if (!r.ok) throw new Error('Companies list unavailable')
        return r.json()
      })
      .then(data => setCompanies(data.companies || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch('/api/insights/top-movers')
      .then(r => {
        if (!r.ok) throw new Error('Movers data unavailable')
        return r.json()
      })
      .then(data => {
        const returnMap = {}
        const gainers = data?.top_gainers || []
        const losers = data?.top_losers || []
        ;[...gainers, ...losers].forEach(m => {
          if (m?.symbol) returnMap[m.symbol] = m.daily_return_pct
        })
        setMovers(returnMap)
      })
      .catch(() => {})
  }, [])

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.display_symbol.toLowerCase().includes(search.toLowerCase())
    const matchSector = sector === 'All' || c.sector === sector
    return matchSearch && matchSector
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">SS</div>
        <div>
          <div className="sidebar-brand-title">StockSight</div>
          <div className="sidebar-caption">Dark intelligence dashboard</div>
        </div>
      </div>

      <div className="sidebar-panel">
        <div className="sidebar-title-row">
          <div className="sidebar-title">Workspace</div>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                className={`sidebar-nav-item${activeTab === item.id ? ' active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <span className="sidebar-nav-icon">
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className="sidebar-nav-copy">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="sidebar-panel sidebar-panel-grow">
        <div className="sidebar-title-row">
          <div>
            <div className="sidebar-title">Stock Universe</div>
            <div className="sidebar-caption">
              {companies.length} tracked names
              {selectedSymbol ? ` · ${selectedSymbol.replace('.NS', '')} selected` : ''}
            </div>
          </div>
          <BarChart3 size={15} strokeWidth={1.8} className="sidebar-title-icon" />
        </div>

        <div className="search-input-wrap">
          <span className="search-icon">
            <Search size={14} strokeWidth={1.9} />
          </span>
          <input
            id="sidebar-search"
            className="search-input"
            placeholder="Search company or symbol..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sector-filter">
          {SECTORS.map(s => (
            <button
              key={s}
              className={`sector-chip${sector === s ? ' active' : ''}`}
              onClick={() => setSector(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="company-list">
          {loading && (
            <div className="loading-wrap sidebar-loading">
              <div className="spinner" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="sidebar-empty">
              No companies match the current search or sector filter.
            </div>
          )}
          {filtered.map(c => {
            const ret = movers?.[c.symbol]
            return (
              <button
                key={c.symbol}
                id={`company-item-${c.display_symbol}`}
                className={`company-item${selectedSymbol === c.symbol ? ' active' : ''}`}
                onClick={() => onSelectSymbol(c.symbol, c)}
              >
                <div className="company-icon-wrap">
                  <span className="company-symbol">{c.display_symbol.slice(0, 3)}</span>
                </div>
                <div className="company-info">
                  <div className="company-name-row">
                    <div className="company-name">{c.display_symbol}</div>
                    <ChevronsUpDown size={13} strokeWidth={1.8} className="company-chevron" />
                  </div>
                  <div className="company-sector">{c.name}</div>
                  <div className="company-meta-row">
                    <span className="company-sector-tag">{c.sector}</span>
                    {ret !== undefined && (
                      <span className={`company-return ${ret > 0 ? 'positive' : ret < 0 ? 'negative' : 'neutral'}`}>
                        {ret > 0 ? '+' : ''}{ret.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="sidebar-footnote">
        Search, filter, or select a symbol to open the same data panels in a cleaner shell.
      </div>
    </aside>
  )
}
