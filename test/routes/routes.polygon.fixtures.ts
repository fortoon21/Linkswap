import { ethers } from "hardhat";

import { polygonConfig } from "../../config/matic_config";
import { Approve, ApproveProxy, RouteProxy } from "../../src/types";
import type {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  StableSwapAdapter,
  StableSwapNoRegistryAdapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../../src/types/SmartRoute/adapter";
import { TrashUniV2Adapter } from "../../src/types/SmartRoute/adapter/TrashUniV2Adapter";
import { fixtureCommonRoute } from "./routes.common.fixtures";

export async function fixturePolygonRoute(): Promise<{
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  ellipsisAdapter: EllipsisAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  trashUniV2Adapter: TrashUniV2Adapter;
  uniV3Adapter: UniV3Adapter;
  routeProxy: RouteProxy;
  approveProxy: ApproveProxy;
  approve: Approve;
}> {
  const common = await fixtureCommonRoute(
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
