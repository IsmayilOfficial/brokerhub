import assert from 'node:assert/strict'
import test from 'node:test'
import { estimateBrokerCost } from './costCalculator.js'

const broker = {
  feeModel: {
    commissionPerTrade: 2,
    spreadBps: { Stocks: 10 },
    swapPerNight: { Stocks: 0.5 },
    inactivityFeePerYear: 12,
    withdrawalFee: 3,
  },
}

test('estimates annual trade and other fees using the selected holding period', () => {
  const result = estimateBrokerCost(broker, {
    tradesPerMonth: 10,
    averageTradeSize: 1000,
    asset: 'Stocks',
    holding: 'swing',
    currency: 'USD',
  })

  assert.equal(result.commissionPerTrade, 2)
  assert.equal(result.estimatedSpreadPerTrade, 1)
  assert.equal(result.swapPerTrade, 1.5)
  assert.equal(result.otherAnnualFees, 48)
  assert.equal(result.yearlyCost, 588)
})

test('applies the selected display currency conversion', () => {
  const result = estimateBrokerCost(broker, {
    tradesPerMonth: 0,
    averageTradeSize: 500,
    asset: 'Stocks',
    holding: 'dayTrade',
    currency: 'EUR',
  })

  assert.ok(Math.abs(result.yearlyCost - 44.16) < 1e-8)
})
