import { SEED, SECTORS_BASE, SPX_SEED } from '../data/marketSeed.js'

export { SEED, SECTORS_BASE, SPX_SEED }

export function timeNow(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function fmt(number, digits = 2) {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function fmtVol(number) {
  if (number >= 1000000) return `${(number / 1000000).toFixed(2)}M`
  if (number >= 1000) return `${(number / 1000).toFixed(0)}K`
  return String(Math.round(number))
}

export function pct(price, open) {
  return ((price - open) / open) * 100
}

export function freshSim() {
  const time = timeNow()
  return {
    spx: SPX_SEED,
    spxHistory: [SPX_SEED],
    tick: 0,
    firms: SEED.map(([ticker, name, price, sector], index) => ({
      ticker,
      name,
      open: price,
      price,
      history: [price],
      dir: 0,
      sector,
      volume: 850000 + index * 137000 + (ticker.charCodeAt(0) % 7) * 92000,
      ticks: [{ time, price, change: 0 }],
    })),
  }
}

export function initialLogs() {
  const time = timeNow()
  return [
    { id: 1, time, text: 'BOT: Started — scanning 20 companies.', kind: 'BOT' },
    { id: 2, time, text: 'SCAN: Checking SPX structure — passed the trend filter.', kind: 'SCAN' },
    { id: 3, time, text: 'FILTER: Ranking top movers by volume and momentum.', kind: 'FILTER' },
  ]
}

export function makeLog(id, firms) {
  const firm = firms[Math.floor(Math.random() * firms.length)]
  const up = Math.random() > 0.48
  const templates = [
    ['SCAN', `SCAN: Checking ${firm.ticker} momentum — price at ${fmt(firm.price)}.`],
    ['SIGNAL', `SIGNAL: ${firm.ticker} ${up ? 'UP' : 'DOWN'} — momentum near ${up ? '+' : '−'}${(Math.random() * 1.4 + 0.2).toFixed(2)}%.`],
    ['BOT', 'BOT: Top movers resorted — leaders list refreshed.'],
    ['FILTER', `FILTER: Volume increase detected for ${firm.ticker} — checking signal strength.`],
    ['BOT', `BOT: Risk filter updated for ${firm.ticker} — position size maintained.`],
    ['WARNING', `WARNING: Rapid move in ${firm.ticker} — awaiting confirmation.`],
    ['SCAN', 'SCAN: Checking sector rotation — technology remains in the lead.'],
  ]
  const [kind, text] = templates[Math.floor(Math.random() * templates.length)]
  return { id, time: timeNow(), kind, text }
}

export function pointsFor(history, width, height, padding = 6) {
  if (history.length < 2) return ''
  const min = Math.min(...history)
  const max = Math.max(...history)
  const span = max - min || 1
  return history.map((value, index) => {
    const x = (index / (history.length - 1)) * (width - padding * 2) + padding
    const y = height - padding - ((value - min) / span) * (height - padding * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export function areaPath(history, width, height) {
  const points = pointsFor(history, width, height)
  if (!points) return ''
  const list = points.split(' ')
  const firstX = list[0].split(',')[0]
  const lastX = list[list.length - 1].split(',')[0]
  return `M ${firstX},${height} L ${list.join(' L ')} L ${lastX},${height} Z`
}

export function fiftyTwo(open, ticker) {
  const seed = ticker.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0)
  const low = open * (0.68 + (seed % 9) * 0.008)
  const high = open * (1.22 + (seed % 7) * 0.012)
  return { low, high }
}
