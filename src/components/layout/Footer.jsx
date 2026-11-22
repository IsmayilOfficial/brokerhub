import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export function Footer({ terminalTheme = false }) {
  return (
    <footer className={`site-footer${terminalTheme ? ' terminal-shell' : ''}`}>
      <div className="container footer-main">
        <div>
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark">B</span>
            <span>broker<span>hub</span></span>
          </Link>
          <p>Clear comparisons for more confident broker research.</p>
        </div>
        <div className="footer-links">
          <Link to="/brokers">Browse brokers</Link>
          <Link to="/best-brokers">Rankings</Link>
          <Link to="/compare">Compare brokers</Link>
          <a href="mailto:hello@brokerhub.example">Contact <ArrowUpRight size={13} /></a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {currentYear} BrokerHub</span>
        <p>Broker information is for research purposes only and is not investment advice.</p>
      </div>
    </footer>
  )
}
