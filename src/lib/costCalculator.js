export const COST_HOLDING_NIGHTS = {
  dayTrade: 0,
  swing: 3,
  longTerm: 30,
}

export const COST_CURRENCY_RATES = {
  USD: 1,
  EUR: 0.92,
  AZN: 1.7,
}

export function estimateBrokerCost(broker, inputs) {
  const { tradesPerMonth, averageTradeSize, asset, holding } = inputs
  const feeModel = broker.feeModel
  const commissionPerTrade = feeModel.commissionPerTrade
  const estimatedSpreadPerTrade =
    averageTradeSize * (feeModel.spreadBps[asset] ?? 0) / 10000
  const swapPerTrade =
    (feeModel.swapPerNight[asset] ?? 0) * COST_HOLDING_NIGHTS[holding]
  const annualTrades = tradesPerMonth * 12
  const otherAnnualFees = feeModel.inactivityFeePerYear + feeModel.withdrawalFee * 12
  const yearlyCostUSD =
    (commissionPerTrade + estimatedSpreadPerTrade + swapPerTrade) * annualTrades
      + otherAnnualFees

  return {
    commissionPerTrade,
    estimatedSpreadPerTrade,
    swapPerTrade,
    otherAnnualFees,
    yearlyCost: yearlyCostUSD * COST_CURRENCY_RATES[inputs.currency],
  }
}
