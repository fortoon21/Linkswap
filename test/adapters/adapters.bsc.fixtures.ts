import { bscConfig } from "../../config/bsc_config";
import type {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  StableSwapAdapter,
  StableSwapNoRegistryAdapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../../src/types/SmartRoute/adapter";
import { fixtureCommonAdapter } from "./adapters.common.fixtures";

export async function fixtureBscAdapter(): Promise<{
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  ellipsisAdapter: EllipsisAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  uniV3Adapter: UniV3Adapter;
}> {
  return await fixtureCommonAdapter(bscConfig.tokens.wnative, bscConfig.uni2Dexes, bscConfig.curveDexes);
}
