import { ArrowRight, GitCompareArrows, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrokerMark } from '../components/BrokerMark.jsx'
import { brokers } from '../data/brokers.js'
import { useCompare } from '../context/useCompare.js'

const rows = [
  { label: 'Trust score', value: (broker) => `${broker.trustScore} / 100` },
  { label: 'Minimum deposit', value: (broker) => broker.minDeposit ? `$${broker.minDeposit}` : 'No minimum' },
  { label: 'Typical spread', value: (broker) => broker.spread },
  { label: 'Regulation', value: (broker) => broker.regulation.join(', ') },
  { label: 'Markets', value: (broker) => broker.markets.join(', ') },
  { label: 'Platforms', value: (broker) => broker.platforms.join(', ') },
]

export function ComparePage() {
  const { selectedIds, removeFromCompare } = useCompare()
  const selected = selectedIds.map((id) => brokers.find((broker) => broker.id === id)).filter(Boolean)

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-intro">
          <div><span className="eyebrow">Side by side</span><h1>Compare brokers</h1><p>Review key details together to find the right fit for your research.</p></div>
          <Link className="button button-outline" to="/brokers">Add a broker <ArrowRight size={15} /></Link>
        </div>
        {selected.length ? (
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead><tr><th scope="col">Broker details</th>{selected.map((broker) => <th scope="col" key={broker.id}><div className="compare-broker-head"><BrokerMark broker={broker} /><div><Link to={`/brokers/${broker.slug}`}>{broker.name}</Link><span>Founded {broker.founded}</span></div><button aria-label={`Remove ${broker.name} from comparison`} className="icon-button remove-compare" onClick={() => removeFromCompare(broker.id)} type="button"><X size={16} /></button></div></th>)}</tr></thead>
              <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{selected.map((broker) => <td key={broker.id}>{row.value(broker)}</td>)}</tr>)}</tbody>
              <tfoot><tr><th scope="row">Profile</th>{selected.map((broker) => <td key={broker.id}><Link className="text-link" to={`/brokers/${broker.slug}`}>View details <ArrowRight size={14} /></Link></td>)}</tr></tfoot>
            </table>
          </div>
        ) : (
          <div className="empty-state compare-empty"><span className="empty-icon"><GitCompareArrows size={23} /></span><h2>Your comparison is ready to build</h2><p>Add up to three brokers to see their scores, costs, markets, and platforms side by side.</p><Link className="button button-dark" to="/brokers">Browse brokers <ArrowRight size={15} /></Link></div>
        )}
        {selected.length > 0 && selected.length < 3 && <div className="compare-hint"><GitCompareArrows size={17} /><span>Compare up to 3 brokers at once.</span><Link to="/brokers">Add another broker <ArrowRight size={14} /></Link></div>}
        <p className="compare-disclaimer">Comparison information is illustrative and may vary by jurisdiction, product, or account type. Verify all details with each provider.</p>
      </div>
    </section>
  )
}
