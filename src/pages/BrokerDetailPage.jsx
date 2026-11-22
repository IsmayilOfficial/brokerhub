import { ArrowLeft, ArrowUpRight, Check, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BrokerMark } from '../components/BrokerMark.jsx'
import { brokers } from '../data/brokers.js'

export function BrokerDetailPage() {
  const { slug } = useParams()
  const broker = brokers.find((entry) => entry.slug === slug)

  if (!broker) {
    return <section className="container detail-not-found"><h1>Broker not found</h1><p>This profile may have moved or is not in our current directory.</p><Link className="button button-dark" to="/brokers"><ArrowLeft size={16} /> Browse brokers</Link></section>
  }

  const scores = [
    ['Trust & regulation', broker.trustScore],
    ['Fees', broker.feeScore],
    ['Markets', broker.marketsScore],
    ['Customer support', broker.supportScore],
    ['Trading platforms', broker.platformsScore],
  ]

  return (
    <section className="page-section detail-page">
      <div className="container">
        <Link className="back-link" to="/brokers"><ArrowLeft size={15} /> All brokers</Link>
        <div className="detail-hero">
          <div className="detail-heading">
            <BrokerMark broker={broker} large />
            <div><span className="eyebrow">Broker profile</span><h1>{broker.name}</h1><p>{broker.description}</p></div>
          </div>
          <div className="detail-score"><span>BrokerHub score</span><strong>{broker.trustScore}<small>/100</small></strong><span className="score-caption"><ShieldCheck size={14} /> Based on our review criteria</span></div>
        </div>
        <div className="detail-columns">
          <div className="detail-main">
            <section className="content-card">
              <div className="card-title-row"><div><span className="eyebrow">At a glance</span><h2>Broker overview</h2></div><span className="updated-note">Profile summary</span></div>
              <div className="overview-grid">
                <div><span>Founded</span><strong>{broker.founded}</strong></div><div><span>Minimum deposit</span><strong>{broker.minDeposit ? `$${broker.minDeposit}` : 'No minimum'}</strong></div><div><span>Typical spread</span><strong>{broker.spread}</strong></div><div><span>Trust score</span><strong>{broker.trustScore} / 100</strong></div>
              </div>
            </section>
            <section className="content-card">
              <div className="card-title-row"><div><span className="eyebrow">What to know</span><h2>Strengths & considerations</h2></div></div>
              <div className="pros-cons">
                <div><h3 className="pros-title">What stands out</h3>{broker.pros.map((item) => <p className="bullet-row" key={item}><Check size={15} /> {item}</p>)}</div>
                <div><h3 className="consider-title">Worth considering</h3>{broker.cons.map((item) => <p className="bullet-row" key={item}><span className="bullet-dot" /> {item}</p>)}</div>
              </div>
            </section>
            <section className="content-card">
              <div className="card-title-row"><div><span className="eyebrow">Scoring breakdown</span><h2>How the score is built</h2></div></div>
              <div className="score-list">{scores.map(([label, score]) => <div className="score-detail-row" key={label}><span>{label}</span><div className="score-track"><span style={{ width: `${score}%` }} /></div><strong>{score}</strong></div>)}</div>
              <p className="method-note">Overall score weights trust (35%), fees (25%), markets (20%), support (10%), and platforms (10%).</p>
            </section>
          </div>
          <aside className="detail-side">
            <section className="content-card side-card"><span className="eyebrow">Coverage</span><h2>Markets & platforms</h2><h3>Markets</h3><div className="tag-row">{broker.markets.map((market) => <span className="tag" key={market}>{market}</span>)}</div><h3>Regulators</h3><div className="tag-row">{broker.regulation.map((item) => <span className="tag tag-outline" key={item}>{item}</span>)}</div><h3>Platforms</h3><ul className="plain-list">{broker.platforms.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section className="disclosure-card"><ShieldCheck size={20} /><strong>Do your own research</strong><p>Availability, fees, and investor protections vary by country and account type. Verify details with the broker.</p><a href="https://www.investor.gov/" rel="noreferrer" target="_blank">Investor resources <ExternalLink size={13} /></a></section>
            <Link className="button button-dark full-button" to="/compare">Compare brokers <ArrowUpRight size={15} /></Link>
          </aside>
        </div>
      </div>
    </section>
  )
}
