import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import {
  UniV3Pool,
  Burn,
  Collect,
  CollectProtocol,
  Flash,
  IncreaseObservationCardinalityNext,
  Initialize,
  Mint,
  SetFeeProtocol,
  Swap
} from "../generated/UniV3Pool/UniV3Pool"
import { GlobalStat } from "../generated/schema"

let router = Address.fromString('0xe592427a0aece92de3edee1f18e0157c05861564')

let eighteenDecimals = BigInt.fromI32(10).pow(18).toBigDecimal()

export function handleSwap(event: Swap): void {
  if (event.transaction.to != router) {
    return
  }

  let globalStats = GlobalStat.load('1')
  if (!globalStats) {
    globalStats = new GlobalStat('1')
    globalStats.swapCount = 0
    globalStats.totalCostETH = BigDecimal.zero()
    globalStats.averageCostETH = BigDecimal.zero()
  }
  globalStats.swapCount += 1
  globalStats.totalCostETH += event.receipt!.gasUsed.times(event.transaction.gasPrice).divDecimal(eighteenDecimals)
  globalStats.averageCostETH = globalStats.totalCostETH.div(BigInt.fromI32(globalStats.swapCount).toBigDecimal())
  globalStats.save()
}
