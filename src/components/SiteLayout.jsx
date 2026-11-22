import { Outlet } from 'react-router-dom'
import { Footer } from './layout/Footer.jsx'
import { Navbar } from './layout/Navbar.jsx'

export function SiteLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <div className="data-preview-note" role="status">
        Preview data: broker details and scores are illustrative and have not been independently verified.
      </div>
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
