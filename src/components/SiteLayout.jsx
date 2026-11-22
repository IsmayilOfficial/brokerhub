import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './layout/Footer.jsx'
import { Navbar } from './layout/Navbar.jsx'

export function SiteLayout() {
  const { pathname } = useLocation()
  const terminalTheme = pathname === '/calculator'
    || pathname === '/quiz'
    || pathname === '/live'
    || pathname.startsWith('/brokers/')

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar terminalTheme={terminalTheme} />
      <div className={`data-preview-note${terminalTheme ? ' terminal-shell' : ''}`} role="status">
        Preview data: broker details and scores are illustrative and have not been independently verified.
      </div>
      <main className={terminalTheme ? 'terminal-shell' : ''} id="main-content">
        <Outlet />
      </main>
      <Footer terminalTheme={terminalTheme} />
    </>
  )
}
