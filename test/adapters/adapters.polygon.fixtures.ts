import { ethers } from "hardhat";

import { polygonConfig } from "../../config/matic_config";
import type {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  StableSwapAdapter,
  StableSwapNoRegistryAdapter,
  TrashUniV2Adapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../../src/types/SmartRoute/adapter";
import { fixtureCommonAdapter } from "./adapters.common.fixtures";

export async function fixturePolygonAdapter(): Promise<{
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  ellipsisAdapter: EllipsisAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  uniV3Adapter: UniV3Adapter;
  trashUniV2Adapter: TrashUniV2Adapter;
}> {
  const common = await fixtureCommonAdapter(
    polygonConfig.tokens.wnative,
    polygonConfig.uni2Dexes,
    polygonConfig.curveDexes,
  );

  const trashUniV2Adapter = await ethers
    .getContractFactory("TrashUniV2Adapter")
    .then(f => f.deploy(common.uniV2Viewer.address))
    .then(c => c.deployed());

  return { ...common, trashUniV2Adapter };
}
