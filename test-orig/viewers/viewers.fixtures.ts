import { ethers } from "hardhat";

import { loadConfig } from "../../config";
import type { BalancerViewer, TokenViewer, UniV2Viewer, UniV3Viewer } from "../../src/types/Viewer";
import { ICurvePoolInfoViewer } from "../../src/types/Viewer/intf";

export async function deployViewersFixture(): Promise<{
  balancerViewer: BalancerViewer;
  curveViewers: Array<ICurvePoolInfoViewer>;
  uniV2Viewer: UniV2Viewer;
  uniV3Viewer: UniV3Viewer;
  tokenViewer: TokenViewer;
}> {
  const config = await loadConfig(ethers);

  const balancerViewer = await ethers
    .getContractFactory("BalancerViewer")
    .then(f => f.deploy())
    .then(c => c.deployed());

  const curveViewers: ICurvePoolInfoViewer[] = await Promise.all(
    config.CurveDexes.map(curveDex => {
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

  const uniV2Viewer = await ethers
    .getContractFactory("UniV2Viewer")
    .then(f =>
      f.deploy(
        config.Uni2Dexes.map(uni2 => uni2.factory),
        config.Uni2Dexes.map(uni2 => uni2.fee),
      ),
    )
    .then(c => c.deployed());
  const uniV3Viewer = await ethers
    .getContractFactory("UniV3Viewer")
    .then(f => f.deploy(config.TickLens))
    .then(c => c.deployed());
  const tokenViewer = await ethers
    .getContractFactory("TokenViewer")
    .then(f => f.deploy())
    .then(c => c.deployed());

  return {
    balancerViewer,
    curveViewers,
    uniV2Viewer,
    uniV3Viewer,
    tokenViewer,
  };
}
