import { ArrowUpRight, Check, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCompare } from '../context/useCompare.js'
import { BrokerMark } from './BrokerMark.jsx'

export function BrokerCard({ broker, rank }) {
  const { selectedIds, toggleCompare } = useCompare()
  const isSelected = selectedIds.includes(broker.id)
  const compareDisabled = !isSelected && selectedIds.length >= 3

  return (
    <article className="broker-card">
      <div className="broker-card-top">
        <div className="broker-identity">
          <BrokerMark broker={broker} />
          <div>
            <Link className="broker-name" to={`/brokers/${broker.slug}`}>{broker.name}</Link>
            <span className="broker-meta">Founded {broker.founded}</span>
          </div>
        </div>
        {rank && <span className="rank-pill">#{rank}</span>}
      </div>
      <div className="broker-score-row">
        <div className="score-number">{broker.trustScore}<span>/100</span></div>
        <div>
          <span className="score-label">Trust score</span>
          <div className="score-track"><span style={{ width: `${broker.trustScore}%` }} /></div>
        </div>
      </div>
      <p className="broker-description">{broker.description}</p>
      <div className="broker-facts">
        <div><span>Min. deposit</span><strong>{broker.minDeposit === 0 ? '$0' : `$${broker.minDeposit}`}</strong></div>
        <div><span>Typical spread</span><strong>{broker.spread}</strong></div>
      </div>
      <div className="tag-row" aria-label="Markets">
        {broker.markets.slice(0, 3).map((market) => <span className="tag" key={market}>{market}</span>)}
      </div>
      <div className="broker-card-actions">
        <Link className="button button-dark button-small" to={`/brokers/${broker.slug}`}>
          View profile <ArrowUpRight size={15} />
        </Link>
        <button
          aria-label={`${isSelected ? 'Remove' : 'Add'} ${broker.name} ${isSelected ? 'from' : 'to'} comparison`}
          className={`button button-quiet button-small${isSelected ? ' is-selected' : ''}`}
          disabled={compareDisabled}
          onClick={() => toggleCompare(broker.id)}
          title={compareDisabled ? 'Compare up to 3 brokers at a time' : undefined}
          type="button"
        >
          {isSelected ? <Check size={15} /> : <Plus size={15} />}
          {isSelected ? 'Added' : 'Compare'}
        </button>
      </div>
    </article>
  )
}
