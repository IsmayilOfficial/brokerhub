import { ArrowRight, Medal, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrokerCard } from '../components/BrokerCard.jsx'
import { brokers } from '../data/brokers.js'

export function RankingsPage() {
  const rankedBrokers = [...brokers].sort((a, b) => b.trustScore - a.trustScore)

  return (
    <section className="page-section">
      <div className="container">
        <div className="ranking-hero">
          <div><span className="eyebrow">BrokerHub rankings</span><h1>Broker scores,<br /><em>made transparent.</em></h1><p>Explore our current sample rankings, and see what goes into each overall score.</p><Link className="button button-dark" to="/brokers">Explore all brokers <ArrowRight size={16} /></Link></div>
          <div className="ranking-note"><span className="ranking-medal"><Medal size={23} /></span><strong>Built to compare</strong><p>We use one consistent framework across every broker profile.</p><div className="ranking-note-rule" /><span><ShieldCheck size={15} /> Trust & regulation <b>35%</b></span><span><ShieldCheck size={15} /> Fees & markets <b>45%</b></span><span><ShieldCheck size={15} /> Support & platform <b>20%</b></span></div>
        </div>
        <div className="section-heading ranking-heading"><div><span className="eyebrow">Current overview</span><h2>Highest-rated brokers</h2><p>Scores are based on the criteria described above.</p></div></div>
        <div className="broker-grid ranking-grid">{rankedBrokers.map((broker, index) => <BrokerCard broker={broker} key={broker.id} rank={index + 1} />)}</div>
        <div className="ranking-disclaimer"><strong>Important</strong><p>This demo uses illustrative sample data and is not a live or independently verified ranking. Broker terms change and may differ by country. Always verify information directly and consider your own needs.</p></div>
      </div>
    </section>
  )
}
