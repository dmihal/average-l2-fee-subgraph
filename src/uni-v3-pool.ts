import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { Swap } from "../generated/UniV3Pool/UniV3Pool"
import { ArbGasPrecompile } from "../generated/UniV3Pool/ArbGasPrecompile"
import { GlobalStat } from "../generated/schema"

let router = Address.fromString('0xe592427a0aece92de3edee1f18e0157c05861564')
let arbGasPrecompile = Address.fromString('0x000000000000000000000000000000000000006C')

let eighteenDecimals = BigInt.fromI32(10).pow(18).toBigDecimal()
let twelveDecimals = BigInt.fromI32(10).pow(12).toBigDecimal()

export function handleSwap(event: Swap): void {
  if (event.transaction.to != router) {
    return
  }

  let ethPrice = event.params.amount1.toBigDecimal().div(event.params.amount0.toBigDecimal()).times(twelveDecimals)
  if (ethPrice.lt(BigDecimal.zero())) {
    ethPrice = ethPrice.neg()
  }

  let gasPrice = ArbGasPrecompile.bind(arbGasPrecompile).getPricesInWei().getValue5()

  let ethFee = event.receipt!.gasUsed.times(gasPrice).divDecimal(eighteenDecimals)
  let usdFee = ethFee.times(ethPrice)

  let globalStats = GlobalStat.load('1')
  if (!globalStats) {
    globalStats = new GlobalStat('1')
    globalStats.swapCount = 0
    globalStats.totalCostETH = BigDecimal.zero()
    globalStats.averageCostETH = BigDecimal.zero()
    globalStats.totalCostUSD = BigDecimal.zero()
    globalStats.averageCostUSD = BigDecimal.zero()
    globalStats.ethPrice = BigDecimal.zero()
  }
  globalStats.swapCount += 1
  globalStats.totalCostETH += ethFee
  globalStats.averageCostETH = globalStats.totalCostETH.div(BigInt.fromI32(globalStats.swapCount).toBigDecimal())
  globalStats.totalCostUSD += usdFee
  globalStats.averageCostUSD = globalStats.totalCostUSD.div(BigInt.fromI32(globalStats.swapCount).toBigDecimal())
  globalStats.ethPrice = ethPrice
  globalStats.save()
}
