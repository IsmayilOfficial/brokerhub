import { ArrowDownWideNarrow, Calculator, Info } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BrokerMark } from '../components/BrokerMark.jsx'
import { brokers } from '../data/brokers.js'
import { COST_CURRENCY_RATES, estimateBrokerCost } from '../lib/costCalculator.js'

const assets = ['Stocks', 'ETF', 'Forex', 'Crypto']
const holdings = [
  { value: 'dayTrade', label: 'Day trade' },
  { value: 'swing', label: 'Swing' },
  { value: 'longTerm', label: 'Long-term' },
]
const currencies = ['USD', 'EUR', 'AZN']
const defaults = { trades: '20', size: '1000', asset: 'Stocks', holding: 'swing', currency: 'USD' }

function boundedNumber(value, fallback, min, max) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function CalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const inputs = useMemo(() => ({
    tradesPerMonth: boundedNumber(searchParams.get('trades'), 20, 0, 1000),
    averageTradeSize: boundedNumber(searchParams.get('size'), 1000, 1, 10000000),
    asset: assets.includes(searchParams.get('asset')) ? searchParams.get('asset') : defaults.asset,
    holding: holdings.some(({ value }) => value === searchParams.get('holding'))
      ? searchParams.get('holding')
      : defaults.holding,
    currency: currencies.includes(searchParams.get('currency'))
      ? searchParams.get('currency')
      : defaults.currency,
  }), [searchParams])

  function updateInput(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value === defaults[key]) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const estimates = useMemo(
    () => brokers
      .map((broker) => ({
        broker,
        ...estimateBrokerCost(broker, inputs),
      }))
      .sort((a, b) => a.yearlyCost - b.yearlyCost),
    [inputs],
  )

  return (
    <section className="page-section terminal-page calculator-page">
      <div className="terminal-container">
        <div className="terminal-page-heading">
          <span className="terminal-kicker"><Calculator size={14} /> BROKERHUB / COST MODEL</span>
          <h1>True Cost Calculator</h1>
          <p>Estimate how trading frequency, trade size, and holding time can affect your yearly costs.</p>
        </div>
        <div className="terminal-panel calculator-controls">
          <div className="terminal-panel-heading"><span>YOUR SCENARIO</span><span className="terminal-status"><i /> ILLUSTRATIVE ESTIMATE</span></div>
          <div className="calculator-input-grid">
            <label>Trades / month<input min="0" max="1000" onChange={(event) => updateInput('trades', event.target.value)} type="number" value={inputs.tradesPerMonth} /></label>
            <label>Average trade size (USD)<input min="1" max="10000000" onChange={(event) => updateInput('size', event.target.value)} type="number" value={inputs.averageTradeSize} /></label>
            <label>Asset<select onChange={(event) => updateInput('asset', event.target.value)} value={inputs.asset}>{assets.map((asset) => <option key={asset}>{asset}</option>)}</select></label>
            <label>Holding period<select onChange={(event) => updateInput('holding', event.target.value)} value={inputs.holding}>{holdings.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Currency<select onChange={(event) => updateInput('currency', event.target.value)} value={inputs.currency}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          </div>
          <p className="terminal-footnote"><Info size={13} /> Estimates use sample fee assumptions and demo USD conversions (EUR 0.92 / USD, AZN 1.70 / USD). Not live quotes or broker fee schedules.</p>
        </div>
        <div className="terminal-section-heading"><div><span className="terminal-kicker">COST COMPARISON</span><h2>Estimated yearly costs</h2></div><span className="terminal-sort"><ArrowDownWideNarrow size={14} /> LOWEST ESTIMATE FIRST</span></div>
        <div className="terminal-table-wrap">
          <table className="terminal-table calculator-table">
            <thead><tr><th scope="col">RANK / BROKER</th><th scope="col">EST. YEARLY COST</th><th scope="col">COMMISSION / TRADE</th><th scope="col">EST. SPREAD / TRADE</th><th scope="col">OTHER FEES / YEAR</th></tr></thead>
            <tbody>{estimates.map(({ broker, commissionPerTrade, estimatedSpreadPerTrade, otherAnnualFees, yearlyCost }, index) => (
              <tr key={broker.id}>
                <td><span className="terminal-broker-cell"><span className="terminal-rank">#{index + 1}</span><BrokerMark broker={broker} /><Link to={`/brokers/${broker.slug}`}>{broker.name}</Link></span></td>
                <td className="terminal-total">{formatCurrency(yearlyCost, inputs.currency)}</td>
                <td>{formatCurrency(commissionPerTrade, inputs.currency)}</td>
                <td>{formatCurrency(estimatedSpreadPerTrade, inputs.currency)}</td>
                <td>{formatCurrency(otherAnnualFees * COST_CURRENCY_RATES[inputs.currency], inputs.currency)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="terminal-disclaimer">Estimates based on illustrative data. Verify fees on the broker&apos;s official site. Actual costs can vary by account, product, trade, jurisdiction, and fee schedule.</p>
      </div>
    </section>
  )
}
