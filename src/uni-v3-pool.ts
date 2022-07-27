import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { Swap } from "../generated/UniV3Pool/UniV3Pool"
import { getDay, getEthFee, getEthPrice, getGlobal } from "./lib"

let router = Address.fromString('0xe592427a0aece92de3edee1f18e0157c05861564')
export function handleSwap(event: Swap): void {
  if (event.transaction.to != router) {
    return
  }

  let ethPrice = getEthPrice(event.params.amount0, event.params.amount1)
  let ethFee = getEthFee(event)
  let usdFee = ethFee.times(ethPrice)

  log.info("swap tx {} eth {} ${}", [event.transaction.hash.toHex(), ethFee.toString(), usdFee.toString()])

  if (usdFee.gt(BigInt.fromI32(1000).toBigDecimal())) {
    return
  }

  let globalStats = getGlobal()
  globalStats.swapCount += 1
  globalStats.totalSwapCostETH += ethFee
  globalStats.averageSwapCostETH = globalStats.totalSwapCostETH.div(BigInt.fromI32(globalStats.swapCount).toBigDecimal())
  globalStats.totalSwapCostUSD += usdFee
  globalStats.averageSwapCostUSD = globalStats.totalSwapCostUSD.div(BigInt.fromI32(globalStats.swapCount).toBigDecimal())
  globalStats.ethPrice = ethPrice

  let dayStats = getDay(event.block.timestamp.toI32())
  dayStats.swapCount += 1
  dayStats.totalSwapCostETH += ethFee
  dayStats.averageSwapCostETH = dayStats.totalSwapCostETH.div(BigInt.fromI32(dayStats.swapCount).toBigDecimal())
  dayStats.totalSwapCostUSD += usdFee
  dayStats.averageSwapCostUSD = dayStats.totalSwapCostUSD.div(BigInt.fromI32(dayStats.swapCount).toBigDecimal())

  globalStats.save()
  dayStats.save()
}
