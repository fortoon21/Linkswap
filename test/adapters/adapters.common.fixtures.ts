import { ethers } from "hardhat";

import { CurveDex, Uni2Dex, Uni3Dex } from "../../config/types";
import type {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  StableSwapAdapter,
  StableSwapNoRegistryAdapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../../src/types/SmartRoute/adapter";
import type { UniV2Viewer } from "../../src/types/Viewer/UniV2Viewer";

export const fixtureCommonAdapter = async (
  wnative: string,
  uni2Dexes: Uni2Dex[],
  curveDexes: CurveDex[],
): Promise<{
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  ellipsisAdapter: EllipsisAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  uniV3Adapter: UniV3Adapter;
  uniV2Viewer: UniV2Viewer;
}> => {
  const uniV2Viewer = await ethers
    .getContractFactory("UniV2Viewer")
    .then(f =>
      f.deploy(
        uni2Dexes.map(uni2 => uni2.factory),
        uni2Dexes.map(uni2 => uni2.fee),
      ),
    )
    .then(c => c.deployed());

  const balancerAdapter = await ethers
    .getContractFactory("BalancerAdapter")
    .then(f => f.deploy(wnative))
    .then(c => c.deployed());

  let curveAdapter: CurveAdapter | undefined;
  let ellipsisAdapter: EllipsisAdapter | undefined;
  let stableSwapAdapter: StableSwapAdapter | undefined;
  for (const curveDex of curveDexes) {
    if (curveDex.forkType == "curve") {
      curveAdapter = await ethers
        .getContractFactory("CurveAdapter")
        .then(f =>
          f.deploy(
            wnative,
            curveDex.registry,
            curveDex.cryptoRegistry,
            curveDex.factoryRegistry,
            curveDex.cryptoFactoryRegistry,
          ),
        )
        .then(c => c.deployed());
    } else if (curveDex.forkType == "ellipsis") {
      ellipsisAdapter = await ethers
        .getContractFactory("EllipsisAdapter")
        .then(f => f.deploy(wnative, curveDex.registry, curveDex.cryptoRegistry, curveDex.cryptoFactoryRegistry));
    } else if (curveDex.forkType == "stableswap") {
      stableSwapAdapter = await ethers
        .getContractFactory("StableSwapAdapter")
        .then(f => f.deploy(curveDex.registry, wnative))
        .then(c => c.deployed());
    }
  }
  const uniV2Adapter = await ethers
    .getContractFactory("UniV2Adapter")
    .then(f => f.deploy(uniV2Viewer.address))
    .then(c => c.deployed());
  const uniV3Adapter = await ethers
    .getContractFactory("UniV3Adapter")
    .then(f => f.deploy(wnative))
    .then(c => c.deployed());
  const stableSwapNoRegistryAdapter = await ethers
    .getContractFactory("StableSwapNoRegistryAdapter")
    .then(f => f.deploy())
    .then(c => c.deployed());

  return {
    uniV2Viewer,
    balancerAdapter,
    ellipsisAdapter,
    curveAdapter,
    uniV2Adapter,
    uniV3Adapter,
    stableSwapNoRegistryAdapter,
    stableSwapAdapter,
  };
};
