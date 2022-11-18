import { polygonConfig } from "../../config/matic_config";
import type { BalancerViewer, TokenViewer, UniV2Viewer, UniV3Viewer } from "../../src/types/Viewer";
import { ICurveCryptoPoolInfoViewer, ICurvePoolInfoViewer } from "../../src/types/Viewer/intf";
import { fixtureCommonViewer } from "./viewers.common.fixtures";

export async function fixturePolygonViewer(): Promise<{
  balancerViewer: BalancerViewer;
  curveViewers: Array<ICurvePoolInfoViewer>;
  curveCryptoViewers: Array<ICurveCryptoPoolInfoViewer>;
  uniV2Viewer: UniV2Viewer;
  uniV3Viewer: UniV3Viewer;
  tokenViewer: TokenViewer;
}> {
  return await fixtureCommonViewer(polygonConfig.curveDexes, polygonConfig.uni2Dexes);
}
