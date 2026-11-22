import { motion } from 'framer-motion'
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BrokerCard } from '../components/BrokerCard.jsx'
import { FilterSheet } from '../components/FilterSheet.jsx'
import { brokers, sortOptions } from '../data/brokers.js'

const marketOptions = ['Stocks', 'Forex', 'Indices', 'Options', 'Cryptocurrency']
const regulationOptions = ['FCA', 'ASIC', 'SEC', 'CFTC', 'CySEC', 'FINRA']

function FilterControls({ params, setParam, reset, className = '' }) {
  return (
    <div className={`filter-controls ${className}`}>
      <div className="filter-heading"><span><SlidersHorizontal size={17} /> Refine results</span><button className="reset-button" onClick={reset} type="button"><RotateCcw size={13} /> Reset</button></div>
      <fieldset className="filter-group">
        <legend>Market</legend>
        {marketOptions.map((market) => <label className="check-option" key={market}><input checked={params.getAll('market').includes(market)} onChange={(event) => setParam('market', market, event.target.checked)} type="checkbox" /><span>{market}</span></label>)}
      </fieldset>
      <fieldset className="filter-group">
        <legend>Regulation</legend>
        {regulationOptions.map((regulation) => <label className="check-option" key={regulation}><input checked={params.getAll('regulation').includes(regulation)} onChange={(event) => setParam('regulation', regulation, event.target.checked)} type="checkbox" /><span>{regulation}</span></label>)}
      </fieldset>
      <fieldset className="filter-group">
        <legend>Minimum deposit</legend>
        <label className="select-label" htmlFor={`deposit-${className || 'desktop'}`}>Maximum amount</label>
        <select id={`deposit-${className || 'desktop'}`} onChange={(event) => setParam('deposit', event.target.value)} value={params.get('deposit') || ''}>
          <option value="">Any deposit</option><option value="0">No minimum</option><option value="100">Up to $100</option><option value="500">Up to $500</option>
        </select>
      </fieldset>
      <fieldset className="filter-group">
        <legend>Sort by</legend>
        <label className="select-label" htmlFor={`sort-${className || 'desktop'}`}>Order results</label>
        <select id={`sort-${className || 'desktop'}`} onChange={(event) => setParam('sort', event.target.value)} value={params.get('sort') || 'trust'}>
          {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </fieldset>
    </div>
  )
}

export function BrokersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchTimer = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => () => window.clearTimeout(searchTimer.current), [])

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value.trim()
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (value) next.set('search', value)
      else next.delete('search')
      setSearchParams(next, { replace: true })
    }, 250)
  }, [searchParams, setSearchParams])

  const setParam = useCallback((key, value, checked) => {
    const next = new URLSearchParams(searchParams)
    if (key === 'market' || key === 'regulation') {
      const values = next.getAll(key).filter((entry) => entry !== value)
      if (checked) values.push(value)
      next.delete(key)
      values.forEach((entry) => next.append(key, entry))
    } else if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const reset = useCallback(() => {
    window.clearTimeout(searchTimer.current)
    if (searchInputRef.current) searchInputRef.current.value = ''
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const clearSearch = useCallback(() => {
    window.clearTimeout(searchTimer.current)
    if (searchInputRef.current) searchInputRef.current.value = ''
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const results = useMemo(() => {
    const query = (searchParams.get('search') || '').toLowerCase()
    const markets = searchParams.getAll('market')
    const regulations = searchParams.getAll('regulation')
    const maxDeposit = searchParams.get('deposit')
    const sort = searchParams.get('sort') || 'trust'
    return brokers
      .filter((broker) => {
        const searchable = [broker.name, broker.description, ...broker.markets, ...broker.regulation].join(' ').toLowerCase()
        return (!query || searchable.includes(query))
          && markets.every((market) => broker.markets.includes(market))
          && regulations.every((regulation) => broker.regulation.includes(regulation))
          && (!maxDeposit || broker.minDeposit <= Number(maxDeposit))
          && (maxDeposit !== '0' || broker.minDeposit === 0)
      })
      .sort((a, b) => sort === 'deposit'
        ? a.minDeposit - b.minDeposit
        : sort === 'fees'
          ? b.feeScore - a.feeScore
          : b.trustScore - a.trustScore)
  }, [searchParams])

  return (
    <section className="page-section">
      <div className="container">
        <div className="page-intro">
          <div><span className="eyebrow">Explore the market</span><h1>Find your next broker</h1><p>Compare trusted providers by costs, markets, regulation, and more.</p></div>
          <div className="result-stat"><strong>{results.length.toString().padStart(2, '0')}</strong><span>brokers to explore</span></div>
        </div>
        <div className="listing-toolbar">
          <label className="listing-search"><Search size={18} /><input aria-label="Search brokers" defaultValue={searchParams.get('search') || ''} key={searchParams.get('search') || ''} onChange={handleSearchChange} placeholder="Search by name, market or regulator..." ref={searchInputRef} />{searchParams.get('search') && <button aria-label="Clear search" onClick={clearSearch} type="button">×</button>}</label>
          <button className="button button-outline mobile-filter-trigger" onClick={() => setFiltersOpen(true)} type="button"><Filter size={16} /> Filters</button>
          <label className="sort-control"><span>Sort:</span><select aria-label="Sort brokers" onChange={(event) => setParam('sort', event.target.value)} value={searchParams.get('sort') || 'trust'}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>
        <div className="listing-layout">
          <aside className="desktop-filters"><FilterControls className="desktop" params={searchParams} setParam={setParam} reset={reset} /></aside>
          <div className="listing-results">
            <p className="results-caption">Showing <strong>{results.length}</strong> {results.length === 1 ? 'broker' : 'brokers'}{searchParams.get('search') ? <> matching <strong>“{searchParams.get('search')}”</strong></> : ''}</p>
            {results.length ? (
              <motion.div className="broker-grid listing-grid" layout>
                {results.map((broker, index) => <motion.div layout key={broker.id}><BrokerCard broker={broker} rank={index + 1} /></motion.div>)}
              </motion.div>
            ) : (
              <div className="empty-state"><span className="empty-icon"><Search size={22} /></span><h2>No brokers found</h2><p>Try a different search or remove one of your filters.</p><button className="button button-dark" onClick={reset} type="button">Clear all filters</button></div>
            )}
          </div>
        </div>
      </div>
      <FilterSheet onClose={() => setFiltersOpen(false)} open={filtersOpen}>
        <FilterControls className="mobile" params={searchParams} setParam={setParam} reset={reset} />
        <button className="button button-dark sheet-apply" onClick={() => setFiltersOpen(false)} type="button">Show {results.length} results</button>
      </FilterSheet>
    </section>
  )
}
