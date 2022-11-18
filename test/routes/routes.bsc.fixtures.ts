import { bscConfig } from "../../config/bsc_config";
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
import { fixtureCommonRoute } from "./routes.common.fixtures";

export async function fixtureBscRoute(): Promise<{
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  ellipsisAdapter: EllipsisAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  uniV3Adapter: UniV3Adapter;
  routeProxy: RouteProxy;
  approveProxy: ApproveProxy;
  approve: Approve;
}> {
  return await fixtureCommonRoute(bscConfig.tokens.wnative, bscConfig.uni2Dexes, bscConfig.curveDexes);
}
