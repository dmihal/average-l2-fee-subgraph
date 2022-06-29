import { BigInt } from "@graphprotocol/graph-ts"
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
import { ExampleEntity } from "../generated/schema"

export function handleBurn(event: Burn): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.owner = event.params.owner
  entity.tickLower = event.params.tickLower

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.burn(...)
  // - contract.collect(...)
  // - contract.collectProtocol(...)
  // - contract.factory(...)
  // - contract.fee(...)
  // - contract.feeGrowthGlobal0X128(...)
  // - contract.feeGrowthGlobal1X128(...)
  // - contract.liquidity(...)
  // - contract.maxLiquidityPerTick(...)
  // - contract.mint(...)
  // - contract.observations(...)
  // - contract.observe(...)
  // - contract.positions(...)
  // - contract.protocolFees(...)
  // - contract.slot0(...)
  // - contract.snapshotCumulativesInside(...)
  // - contract.swap(...)
  // - contract.tickBitmap(...)
  // - contract.tickSpacing(...)
  // - contract.ticks(...)
  // - contract.token0(...)
  // - contract.token1(...)
}

export function handleCollect(event: Collect): void {}

export function handleCollectProtocol(event: CollectProtocol): void {}

export function handleFlash(event: Flash): void {}

export function handleIncreaseObservationCardinalityNext(
  event: IncreaseObservationCardinalityNext
): void {}

export function handleInitialize(event: Initialize): void {}

export function handleMint(event: Mint): void {}

export function handleSetFeeProtocol(event: SetFeeProtocol): void {}

export function handleSwap(event: Swap): void {}
