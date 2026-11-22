import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CompareProvider } from './context/CompareContext.jsx'
import { SiteLayout } from './components/SiteLayout.jsx'
import { BrokerDetailPage } from './pages/BrokerDetailPage.jsx'
import { BrokersPage } from './pages/BrokersPage.jsx'
import { ComparePage } from './pages/ComparePage.jsx'
import { CalculatorPage } from './pages/CalculatorPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { QuizPage } from './pages/QuizPage.jsx'
import { RankingsPage } from './pages/RankingsPage.jsx'

const LivePage = lazy(() => import('./pages/LivePage.tsx'))

function App() {
  return (
    <BrowserRouter>
      <CompareProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/brokers" element={<BrokersPage />} />
            <Route path="/brokers/:slug" element={<BrokerDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route
              path="/live"
              element={
                <Suspense fallback={<section className="page-section terminal-page"><div className="terminal-container">Loading simulation terminal…</div></section>}>
                  <LivePage />
                </Suspense>
              }
            />
            <Route path="/best-brokers" element={<RankingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </CompareProvider>
    </BrowserRouter>
  )
}

export default App
