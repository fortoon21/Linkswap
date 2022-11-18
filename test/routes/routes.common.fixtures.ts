import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { CurveDex, Uni2Dex } from "../../config/types";
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
import { UniV2Viewer } from "../../src/types/Viewer/UniV2Viewer";

export const fixtureCommonRoute = async (
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
  routeProxy: RouteProxy;
  approveProxy: ApproveProxy;
  approve: Approve;
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
          f.deploy(wnative, curveDex.registry, curveDex.registry, curveDex.factoryRegistry, curveDex.factoryRegistry),
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

  const approve = await ethers
    .getContractFactory("Approve")
    .then(f => f.deploy())
    .then(c => c.deployed());
  const approveProxy = await ethers
    .getContractFactory("ApproveProxy")
    .then(f => f.deploy(approve.address))
    .then(c => c.deployed());

  const oracles = [
    { coin: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", oracle: "0xc907E116054Ad103354f2D350FD2514433D57F6f" },
    { coin: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", oracle: "0xF9680D99D6C9589e2a93a78A04A279e509205945" },
    {
      coin: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      oracle: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0",
    },
    { coin: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", oracle: "0x0A6513e40db6EB1b165753AD52E80663aeA50545" },
    { coin: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", oracle: "0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D" },
    { coin: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", oracle: "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7" },
    { coin: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39", oracle: "0xd9FFdb71EbE7496cC440152d43986Aae0AB76665" },
  ];
  const tokenAddrs = oracles.map(e => e.coin);
  const oracleAddrs = oracles.map(e => e.oracle);

  const routeProxy = await ethers
    .getContractFactory("RouteProxyPolygon")
    .then(f =>
      f.deploy(approveProxy.address, "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb", wnative, tokenAddrs, oracleAddrs),
    )
    .then(c => c.deployed());
  // const routeProxy = await ethers
  //   .getContractFactory("RouteProxyPolygon")
  //   .then(f => f.deploy(approveProxy.address, "0x0000000000000000000000000000000000000000", wnative))
  //   .then(c => c.deployed());

  const signer = (await ethers.getSigners())[0];
  await approve.init(signer.address, approveProxy.address);
  await approveProxy.init(signer.address, [routeProxy.address]);

  return {
    balancerAdapter,
    ellipsisAdapter,
    curveAdapter,
    uniV2Adapter,
    uniV3Adapter,
    uniV2Viewer,
    stableSwapNoRegistryAdapter,
    stableSwapAdapter,
    routeProxy,
    approveProxy,
    approve,
  };
};
