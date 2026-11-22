import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <section className="container not-found"><span className="eyebrow">404 · Page not found</span><h1>That page is off the map.</h1><p>The link may be outdated, or the page may have moved.</p><Link className="button button-dark" to="/"><ArrowLeft size={15} /> Back to home</Link></section>
}
