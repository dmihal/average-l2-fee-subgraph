import { Address, BigDecimal, BigInt, dataSource, ethereum, log } from "@graphprotocol/graph-ts"
import { Swap } from "../generated/UniV3Pool/UniV3Pool"
import { ArbGasPrecompile } from "../generated/UniV3Pool/ArbGasPrecompile"
import { OptiGasPrecompile } from "../generated/UniV3Pool/OptiGasPrecompile"
import { DayStat, GlobalStat } from "../generated/schema"

let router = Address.fromString('0xe592427a0aece92de3edee1f18e0157c05861564')
let arbGasPrecompile = Address.fromString('0x000000000000000000000000000000000000006C')
let optiGasPrecompile = Address.fromString('0x420000000000000000000000000000000000000F')

let eighteenDecimals = BigInt.fromI32(10).pow(18).toBigDecimal()
let twelveDecimals = BigInt.fromI32(10).pow(12).toBigDecimal()
let ONE_DAY = 86400

function getGasPrice(event: ethereum.Event): BigInt {
  let chainId = dataSource.network()

  if (chainId == 'arbitrum-one') {
    return ArbGasPrecompile.bind(arbGasPrecompile).getPricesInWei().getValue5()
  }

  return event.transaction.gasPrice
}

function getEthFee(event: ethereum.Event): BigDecimal {
  let chainId = dataSource.network()
  let gasPrice = getGasPrice(event)

  if (chainId == 'optimism') {
    let l2Fee = event.receipt!.gasUsed.times(gasPrice)
    let l1Fee = OptiGasPrecompile.bind(optiGasPrecompile).getL1Fee(event.transaction.input)
    return l2Fee.plus(l1Fee).divDecimal(eighteenDecimals)
  }

  return event.receipt!.gasUsed.times(gasPrice).divDecimal(eighteenDecimals)
}

export function handleSwap(event: Swap): void {
  if (event.transaction.to != router) {
    return
  }

  let dayId = event.block.timestamp.toI32() / ONE_DAY
  let date = dayId * ONE_DAY

  let ethPrice = event.params.amount1.toBigDecimal().div(event.params.amount0.toBigDecimal()).times(twelveDecimals)
  if (ethPrice.lt(BigDecimal.zero())) {
    ethPrice = ethPrice.neg()
  }

  let ethFee = getEthFee(event)
  let usdFee = ethFee.times(ethPrice)

  log.info("tx {} eth {} usd {}", [event.transaction.hash.toHex(), ethFee.toString(), usdFee.toString()])

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

  let dayStats = DayStat.load(dayId.toString())
  if (!dayStats) {
    dayStats = new DayStat(dayId.toString())
    dayStats.date = date
    dayStats.swapCount = 0
    dayStats.totalCostETH = BigDecimal.zero()
    dayStats.averageCostETH = BigDecimal.zero()
    dayStats.totalCostUSD = BigDecimal.zero()
    dayStats.averageCostUSD = BigDecimal.zero()
  }
  dayStats.swapCount += 1
  dayStats.totalCostETH += ethFee
  dayStats.averageCostETH = globalStats.totalCostETH.div(BigInt.fromI32(globalStats.swapCount).toBigDecimal())
  dayStats.totalCostUSD += usdFee
  dayStats.averageCostUSD = globalStats.totalCostUSD.div(BigInt.fromI32(globalStats.swapCount).toBigDecimal())

  globalStats.save()
  dayStats.save()
}
