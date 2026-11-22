import assert from 'node:assert/strict'
import test from 'node:test'
import { freshSim, fmtVol, pointsFor } from './simulator.js'
import { SEED, SECTORS_BASE, SPX_SEED } from '../data/marketSeed.js'

test('shares the supplied SPX and 20-firm seed with the initial simulation', () => {
  const initial = freshSim()

  assert.equal(SPX_SEED, 7340.53)
  assert.equal(initial.spx, SPX_SEED)
  assert.equal(SEED.length, 20)
  assert.equal(initial.firms.length, 20)
  assert.deepEqual(initial.firms[0], {
    ticker: 'AAPL',
    name: 'Apple',
    open: 351.91,
    price: 351.91,
    history: [351.91],
    dir: 0,
    sector: 'Information Technology',
    volume: 1034000,
    ticks: [{ time: initial.firms[0].ticks[0].time, price: 351.91, change: 0 }],
  })
  assert.equal(SECTORS_BASE[0].base, 35.51)
  assert.equal(SECTORS_BASE[0].live, 35.51)
})

test('formats volume and maps chart points using the supplied dimensions', () => {
  assert.equal(fmtVol(1500000), '1.50M')
  assert.equal(fmtVol(12000), '12K')
  assert.equal(pointsFor([10, 20, 10], 100, 30), '6.0,24.0 50.0,6.0 94.0,24.0')
})
