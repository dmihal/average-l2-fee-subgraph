import { BigInt, log } from "@graphprotocol/graph-ts"
import { Transfer } from "../generated/USDC/ERC20"
import { getDay, getEthFee, getGlobal } from "./lib"

export function handleTransfer(event: Transfer): void {
  if (event.transaction.to != event.address) {
    return
  }

  let globalStats = getGlobal()

  let ethFee = getEthFee(event)
  let usdFee = ethFee.times(globalStats.ethPrice)

  log.info("xfer tx {} eth {} ${}", [event.transaction.hash.toHex(), ethFee.toString(), usdFee.toString()])

  if (usdFee.gt(BigInt.fromI32(1000).toBigDecimal())) {
    return
  }

  globalStats.transferCount += 1
  globalStats.totalTransferCostETH += ethFee
  globalStats.averageTransferCostETH = globalStats.totalTransferCostETH.div(BigInt.fromI32(globalStats.transferCount).toBigDecimal())
  globalStats.totalTransferCostUSD += usdFee
  globalStats.averageTransferCostUSD = globalStats.totalTransferCostUSD.div(BigInt.fromI32(globalStats.transferCount).toBigDecimal())

  let dayStats = getDay(event.block.timestamp.toI32())
  dayStats.transferCount += 1
  dayStats.totalTransferCostETH += ethFee
  dayStats.averageTransferCostETH = dayStats.totalTransferCostETH.div(BigInt.fromI32(dayStats.transferCount).toBigDecimal())
  dayStats.totalTransferCostUSD += usdFee
  dayStats.averageTransferCostUSD = dayStats.totalTransferCostUSD.div(BigInt.fromI32(dayStats.transferCount).toBigDecimal())

  globalStats.save()
  dayStats.save()
}
