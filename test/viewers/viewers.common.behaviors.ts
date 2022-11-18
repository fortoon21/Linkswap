import { expect } from "chai";

import { Uni2Dex, Uni3Dex } from "../../config/types";
import {
  BalancerViewer,
  ICurveCryptoPoolInfoViewer,
  ICurvePoolInfoViewer,
  TokenViewer,
  UniV2Viewer,
  UniV3Viewer,
} from "../../src/types";
import { logger } from "../logger";

export const testCommonViewerFetchToken = async (wnative: string, tokenViewer: TokenViewer): Promise<void> => {
  await tokenViewer.getTokenMetadata(wnative);
};

export const testCommonViewerUniV2 = async (uni2Dexes: Uni2Dex[], uniV2Viewer: UniV2Viewer): Promise<void> => {
  for (const uni2 of uni2Dexes) {
    const len = await uniV2Viewer.allPairsLength(uni2.factory);
    if (len.lte(0)) {
      continue;
    }

    await uniV2Viewer.getPairInfo(uni2.factory, 0);
  }
};

export const testCommonViewerUniV3 = async (uni3Pool: string, uniV3Viewer: UniV3Viewer): Promise<void> => {
  logger.log(await uniV3Viewer.getPoolInfo(uni3Pool));
  const wordPos = await uniV3Viewer.getCurrentWordPos(uni3Pool);
  logger.log(await uniV3Viewer.getPopulatedTicksInWordWithOffset(uni3Pool, wordPos, 130, 256));
  // wordPos 커질수록 비싸짐 token1 비싸짐
  // logger.log(await uniV3Viewer.getPopulatedTicksInCurretWordWithOffset(uni3Pool, 0, 32));
};

export const testCommonViewerCurve = async (curveViewers: ICurvePoolInfoViewer[]): Promise<void> => {
  for (const curveViewer of curveViewers) {
    const poolAddrs = await curveViewer.pools();
    expect(poolAddrs.length).greaterThan(0);
    await curveViewer.getPoolInfo(poolAddrs[0]);
  }
};

export const testCommonViewerCurveCrypto = async (curveCryptoViewers: ICurveCryptoPoolInfoViewer[]): Promise<void> => {
  // for (const curveCryptoViewer of curveCryptoViewers) {
  //   const poolAddrs = await curveCryptoViewer.pools();
  //   expect(poolAddrs.length).greaterThan(0);
  //   logger.log(await curveCryptoViewer.getPoolInfo(poolAddrs[0]));
  // }
  logger.log(await curveCryptoViewers[0].getPoolInfo("0x92215849c439E1f8612b6646060B4E3E5ef822cC"));
};

// export function testCommonViewerBalancer(config: IConfig, balancerViewer: BalancerViewer): void {
//   it("viewer-balancer", async function () {
//     if (!config.balancerPools || !config.balancerPools.***) {
//       return;
//     }
//     await this.balancerViewer.getPoolInfo(this.config.balancerPool);
//   });
// }
