import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowRight, BadgeCheck, ChartNoAxesCombined, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrokerCard } from '../components/BrokerCard.jsx'
import { brokers } from '../data/brokers.js'

const trustItems = [
  { icon: ShieldCheck, title: 'Compare what matters', copy: 'Trust, fees, markets and platforms in one place.' },
  { icon: ChartNoAxesCombined, title: 'Clear methodology', copy: 'A consistent scoring framework across every profile.' },
  { icon: BadgeCheck, title: 'Research at your pace', copy: 'Side-by-side details without the noise.' },
]

export function HomePage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  function submitSearch(event) {
    event.preventDefault()
    navigate(`/brokers${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`)
  }

  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45 }}
            className="hero-copy"
          >
            <span className="eyebrow"><span className="eyebrow-dot" /> Broker comparisons, made clear</span>
            <h1>Find a broker that fits <em>your next move.</em></h1>
            <p className="hero-lede">Compare brokerage platforms, understand the costs, and build your research shortlist.</p>
            <form className="hero-search" onSubmit={submitSearch}>
              <Search size={19} />
              <input aria-label="Search brokers" onChange={(event) => setSearch(event.target.value)} placeholder="Search brokers or markets..." value={search} />
              <button className="button button-dark" type="submit">Search <ArrowRight size={16} /></button>
            </form>
            <div className="hero-footnote"><span><BadgeCheck size={15} /> Compare side by side</span><span><BadgeCheck size={15} /> No account needed</span></div>
          </motion.div>
          <div className="hero-art" aria-label="Broker comparison snapshot">
            <div className="hero-art-orbit orbit-one" />
            <div className="hero-art-orbit orbit-two" />
            <div className="hero-art-center"><span className="hero-art-icon"><ChartNoAxesCombined size={25} /></span><strong>Better informed.</strong><span>One clear comparison.</span></div>
            <div className="float-card float-card-top"><span className="float-icon float-icon-green"><ShieldCheck size={16} /></span><span><strong>Trust, made clear</strong><small>Compare scores at a glance</small></span></div>
            <div className="float-card float-card-bottom"><span className="float-score">96</span><span><strong>Interactive Brokers</strong><small>Trust score · 96/100</small></span><ArrowDownRight className="float-arrow" size={17} /></div>
            <span className="hero-spark spark-one">✳</span><span className="hero-spark spark-two">✳</span>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-grid">
          {trustItems.map(({ icon: Icon, title, copy }) => (
            <div className="trust-item" key={title}><span className="trust-icon"><Icon size={18} /></span><div><strong>{title}</strong><p>{copy}</p></div></div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-heading">
            <div><span className="eyebrow">A good place to start</span><h2>Popular broker profiles</h2><p>Explore a few of the brokers investors compare most.</p></div>
            <Link className="text-link" to="/brokers">Browse all brokers <ArrowRight size={16} /></Link>
          </div>
          <div className="broker-grid">
            {brokers.slice(0, 3).map((broker, index) => <BrokerCard broker={broker} key={broker.id} rank={index + 1} />)}
          </div>
        </div>
      </section>
      <section className="method-banner">
        <div className="container method-content">
          <div><span className="eyebrow eyebrow-light">Our approach</span><h2>Useful detail.<br />No confusing fine print.</h2><p>See how trust, costs, markets, support, and platform quality come together in a consistent score.</p></div>
          <Link className="button button-light" to="/best-brokers">See how brokers rank <ArrowRight size={16} /></Link>
          <span className="method-decoration" aria-hidden="true">B</span>
        </div>
      </section>
    </>
  )
}
