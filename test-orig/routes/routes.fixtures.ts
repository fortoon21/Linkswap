import { ethers } from "hardhat";

import { loadConfig } from "../../config";
import { bscConfig } from "../../config/bsc_config";
import { RouteProxy } from "../../src/types";
import type {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  StableSwapAdapter,
  StableSwapNoRegistryAdapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../../src/types/SmartRoute/adapter";

export async function deployRoutesFixture(): Promise<{
  balancerAdapter: BalancerAdapter;
  curveAdapter: CurveAdapter | undefined;
  stableSwapNoRegistryAdapter: StableSwapNoRegistryAdapter;
  stableSwapAdapter: StableSwapAdapter | undefined;
  ellipsisAdapter: EllipsisAdapter | undefined;
  uniV2Adapter: UniV2Adapter;
  uniV3Adapter: UniV3Adapter;
  routeProxy: RouteProxy;
}> {
  const config = await loadConfig(ethers);

  const uniV2Viewer = await ethers
    .getContractFactory("UniV2Viewer")
    .then(f =>
      f.deploy(
        config.Uni2Dexes.map(uni2 => uni2.factory),
        config.Uni2Dexes.map(uni2 => uni2.fee),
      ),
    )
    .then(c => c.deployed());

  const balancerAdapter = await ethers
    .getContractFactory("BalancerAdapter")
    .then(f => f.deploy())
    .then(c => c.deployed());

  let curveAdapter: CurveAdapter | undefined;
  let ellipsisAdapter: EllipsisAdapter | undefined;
  let stableSwapAdapter: StableSwapAdapter | undefined;
  for (const curveDex of config.CurveDexes) {
    if (curveDex.forkType == "curve") {
      curveAdapter = await ethers
        .getContractFactory("CurveAdapter")
        .then(f =>
          f.deploy(
            config.WETH,
            curveDex.registry,
            curveDex.registry,
            curveDex.factoryRegistry,
            curveDex.factoryRegistry,
          ),
        )
        .then(c => c.deployed());
    } else if (curveDex.forkType == "ellipsis") {
      ellipsisAdapter = await ethers
        .getContractFactory("EllipsisAdapter")
        .then(f => f.deploy(config.WETH, curveDex.registry));
    } else if (curveDex.forkType == "stableswap") {
      stableSwapAdapter = await ethers
        .getContractFactory("StableSwapAdapter")
        .then(f => f.deploy(curveDex.registry, config.WETH))
        .then(c => c.deployed());
    }
  }
  const uniV2Adapter = await ethers
    .getContractFactory("UniV2Adapter")
    .then(f => f.deploy(uniV2Viewer.address))
    .then(c => c.deployed());
  const uniV3Adapter = await ethers
    .getContractFactory("UniV3Adapter")
    .then(f => f.deploy(config.WETH))
    .then(c => c.deployed());
  const stableSwapNoRegistryAdapter = await ethers
    .getContractFactory("StableSwapNoRegistryAdapter")
    .then(f => f.deploy())
    .then(c => c.deployed());

  const approve = await ethers
    .getContractFactory("Approve")
    .then(f => f.deploy())
    .then(c => c.deployed());
  const approveProxy = await ethers
    .getContractFactory("ApproveProxy")
    .then(f => f.deploy(approve.address))
    .then(c => c.deployed());
  const routeProxy = await ethers
    .getContractFactory("RouteProxy")
    .then(f => f.deploy(approveProxy.address, "0x0000000000000000000000000000000000000000", bscConfig.tokens.wnative))
    .then(c => c.deployed());

  return {
    balancerAdapter,
    ellipsisAdapter,
    curveAdapter,
    uniV2Adapter,
    uniV3Adapter,
    stableSwapNoRegistryAdapter,
    stableSwapAdapter,
    routeProxy,
  };
}
