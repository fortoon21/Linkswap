import { bscConfig } from "../../config/bsc_config";
import type { BalancerViewer, TokenViewer, UniV2Viewer, UniV3Viewer } from "../../src/types/Viewer";
import { ICurvePoolInfoViewer } from "../../src/types/Viewer/intf";
import { fixtureCommonViewer } from "./viewers.common.fixtures";

export async function fixtureBscViewer(): Promise<{
  balancerViewer: BalancerViewer;
  curveViewers: Array<ICurvePoolInfoViewer>;
  uniV2Viewer: UniV2Viewer;
  uniV3Viewer: UniV3Viewer;
  tokenViewer: TokenViewer;
}> {
  return await fixtureCommonViewer(bscConfig.curveDexes, bscConfig.uni2Dexes, bscConfig.uni3Dexes);
}
