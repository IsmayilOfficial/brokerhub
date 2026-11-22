import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCompare } from '../../context/useCompare.js'

const links = [
  { to: '/brokers', label: 'Brokers' },
  { to: '/best-brokers', label: 'Best brokers' },
  { to: '/compare', label: 'Compare' },
]

export function Navbar() {
  const { selectedIds } = useCompare()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="container nav-container">
        <Link className="brand" to="/" aria-label="BrokerHub home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">B</span>
          <span>broker<span>hub</span></span>
        </Link>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          className="icon-button mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
              {label}
              {label === 'Compare' && selectedIds.length > 0 && (
                <span className="nav-count">{selectedIds.length}</span>
              )}
            </NavLink>
          ))}
          <Link className="nav-cta" to="/brokers" onClick={() => setMenuOpen(false)}>
            Explore brokers <ArrowUpRight size={15} />
          </Link>
        </nav>
      </div>
    </header>
  )
}
