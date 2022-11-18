import { Contract } from "ethers";
import { ethers } from "hardhat";

import { CurveDex, Uni2Dex } from "../../config/types";
import type { BalancerViewer, TokenViewer, UniV2Viewer, UniV3Viewer } from "../../src/types/Viewer";
import { ICurveCryptoPoolInfoViewer, ICurvePoolInfoViewer } from "../../src/types/Viewer/intf";

export const fixtureCommonViewer = async (
  curveDexes: CurveDex[],
  uni2Dexes: Uni2Dex[],
): Promise<{
  balancerViewer: BalancerViewer;
  curveViewers: ICurvePoolInfoViewer[];
  curveCryptoViewers: ICurveCryptoPoolInfoViewer[];
  uniV2Viewer: UniV2Viewer;
  uniV3Viewer: UniV3Viewer;
  tokenViewer: TokenViewer;
}> => {
  const balancerViewer = await ethers
    .getContractFactory("BalancerViewer")
    .then(f => f.deploy())
    .then(c => c.deployed());

  const curveViewers: ICurvePoolInfoViewer[] = await Promise.all(
    curveDexes.map(curveDex => {
      if (curveDex.forkType == "curve") {
        return ethers
          .getContractFactory("CurveViewer")
          .then(f => f.deploy(curveDex.registry, curveDex.factoryRegistry))
          .then(c => c.deployed());
      } else if (curveDex.forkType == "ellipsis") {
        return ethers
          .getContractFactory("EllipsisViewer")
          .then(f => f.deploy(curveDex.registry))
          .then(c => c.deployed());
      } else {
        return ethers
          .getContractFactory("StableSwapViewer")
          .then(f => f.deploy())
          .then(c => c.deployed());
      }
    }),
  );

  const cryptoCurveList: any[] = [];
  curveDexes.map(curveDex => {
    if (curveDex.forkType !== "stableswap") {
      cryptoCurveList.push(
        ethers
          .getContractFactory("CurveCryptoViewer")
          .then(f => f.deploy(curveDex.cryptoRegistry, curveDex.cryptoFactoryRegistry))
          .then(c => c.deployed()),
      );
    }
  });
  const curveCryptoViewers: ICurveCryptoPoolInfoViewer[] = await Promise.all(cryptoCurveList);
  const uniV2Viewer = await ethers
    .getContractFactory("UniV2Viewer")
    .then(f =>
      f.deploy(
        uni2Dexes.map(uni2 => uni2.factory),
        uni2Dexes.map(uni2 => uni2.fee),
      ),
    )
    .then(c => c.deployed());

  const uniV3Viewer: UniV3Viewer = await ethers
    .getContractFactory("UniV3Viewer")
    .then(f => f.deploy())
    .then(c => c.deployed());

  const tokenViewer = await ethers
    .getContractFactory("TokenViewer")
    .then(f => f.deploy())
    .then(c => c.deployed());

  return {
    balancerViewer,
    curveViewers,
    curveCryptoViewers,
    uniV2Viewer,
    uniV3Viewer,
    tokenViewer,
  };
};
