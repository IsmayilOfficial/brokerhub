import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CompareProvider } from './context/CompareContext.jsx'
import { SiteLayout } from './components/SiteLayout.jsx'
import { BrokerDetailPage } from './pages/BrokerDetailPage.jsx'
import { BrokersPage } from './pages/BrokersPage.jsx'
import { ComparePage } from './pages/ComparePage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { RankingsPage } from './pages/RankingsPage.jsx'

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
            <Route path="/best-brokers" element={<RankingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </CompareProvider>
    </BrowserRouter>
  )
}

export default App
