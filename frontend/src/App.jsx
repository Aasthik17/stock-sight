import { useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import StockChart from './components/StockChart'
import SummaryCard from './components/SummaryCard'
import PredictionChart from './components/PredictionChart'
import TopMovers from './components/TopMovers'
import MarketOverview from './components/MarketOverview'
import CompareView from './components/CompareView'

function Hero() {
  const highlights = [
    { label: 'Coverage', value: '15 NSE leaders' },
    { label: 'Signals', value: 'RSI, volatility, 52-week ranges' },
    { label: 'Models', value: '7-day ML forecast' },
  ]

  return (
    <section className="hero-banner card fade-in">
      <div className="hero-copy">
        <div className="hero-greeting">Intelligence Workspace</div>
        <h2 className="hero-title">
          A calmer command center for
          <span> India's blue-chip stocks</span>
        </h2>
        <p className="hero-desc">
          Track price structure, momentum, market breadth, and prediction signals from one dark
          dashboard without changing the existing workflow underneath.
        </p>
        <div className="hero-chips">
          {['Live charts', 'RSI-14 momentum', 'Volatility snapshots', 'Model forecasts', 'Correlation analysis'].map(item => (
            <span key={item} className="hero-chip">{item}</span>
          ))}
        </div>
      </div>

      <div className="hero-stats">
        {highlights.map(item => (
          <div key={item.label} className="hero-stat-card">
            <div className="hero-stat-label">{item.label}</div>
            <div className="hero-stat-value">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function DashboardFocusCard({ selectedCompany, activeTab }) {
  return (
    <section className="card dashboard-focus fade-in">
      <div className="card-header">
        <div className="card-title">Workspace Focus</div>
      </div>
      <div className="card-body dashboard-focus-body">
        <div className="dashboard-focus-label">Current mode</div>
        <div className="dashboard-focus-value">
          {activeTab === 'dashboard' ? 'Overview' : activeTab === 'stock' ? 'Stock Detail' : 'Compare'}
        </div>

        <div className="dashboard-focus-grid">
          <div className="dashboard-focus-item">
            <span className="dashboard-focus-item-label">Selected stock</span>
            <strong>{selectedCompany ? selectedCompany.display_symbol : 'None yet'}</strong>
            <span>{selectedCompany ? selectedCompany.name : 'Pick any company from the left rail'}</span>
          </div>
          <div className="dashboard-focus-item">
            <span className="dashboard-focus-item-label">Best next step</span>
            <strong>{selectedCompany ? 'Open detail view' : 'Choose a company'}</strong>
            <span>
              {selectedCompany
                ? 'Use the Stock Detail tab for chart, summary, and prediction panels.'
                : 'Search or filter the stock universe to drill into a specific symbol.'}
            </span>
          </div>
        </div>

        <div className="dashboard-note">
          Transforming real-time market data into actionable insights to help you analyze trends, 
          track performance, and make smarter investment decisions.
        </div>
      </div>
    </section>
  )
}

function DashboardView({ selectedCompany, activeTab }) {
  return (
    <div className="view-stack">
      <div className="dashboard-grid">
        <Hero />
        <DashboardFocusCard selectedCompany={selectedCompany} activeTab={activeTab} />
        <div className="dashboard-span-two">
          <TopMovers />
        </div>
        <MarketOverview />
      </div>
    </div>
  )
}

function StockDetailView({ selectedSymbol, selectedCompany }) {
  if (!selectedSymbol) {
    return (
      <div className="empty-state">
        <div className="empty-icon">SS</div>
        <div className="empty-title">No stock selected</div>
        <div className="empty-desc">Pick a company from the sidebar to view its full analysis.</div>
      </div>
    )
  }
  return (
    <div className="view-stack">
      <StockChart symbol={selectedSymbol} companyInfo={selectedCompany} />
      <div className="detail-grid">
        <SummaryCard symbol={selectedSymbol} />
        <PredictionChart symbol={selectedSymbol} />
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)

  const handleSelectSymbol = (symbol, companyInfo) => {
    setSelectedSymbol(symbol)
    setSelectedCompany(companyInfo)
    setActiveTab('stock')
  }

  return (
    <div className="workspace-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={handleSelectSymbol}
      />

      <div className="workspace-main">
        <Navbar
          activeTab={activeTab}
          selectedSymbol={selectedSymbol}
          selectedCompany={selectedCompany}
        />
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <DashboardView selectedCompany={selectedCompany} activeTab={activeTab} />
          )}
          {activeTab === 'stock' && (
            <StockDetailView selectedSymbol={selectedSymbol} selectedCompany={selectedCompany} />
          )}
          {activeTab === 'compare' && <CompareView />}
        </main>
      </div>
    </div>
  )
}
