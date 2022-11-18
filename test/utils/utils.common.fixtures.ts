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
  TrashUniV2Adapter,
  UniV2Adapter,
  UniV3Adapter,
} from "../../src/types/SmartRoute/adapter";
import { TokenValidChecker } from "../../src/types/Util/TokenValidChecker.sol";
import { UniV2Viewer } from "../../src/types/Viewer/UniV2Viewer";

export const fixtureCommonTokenValidChecker = async (
  wnative: string,
  uni2Dexes: Uni2Dex[],
): Promise<{
  tokenValidChecker: TokenValidChecker;
  routeProxy: RouteProxy;
  uniV2Adapter: UniV2Adapter;
  trashUniV2Adapter: TrashUniV2Adapter;
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

  const uniV2Adapter = await ethers
    .getContractFactory("UniV2Adapter")
    .then(f => f.deploy(uniV2Viewer.address))
    .then(c => c.deployed());

  const trashUniV2Adapter = await ethers
    .getContractFactory("TrashUniV2Adapter")
    .then(f => f.deploy(uniV2Viewer.address))
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
    .then(f => f.deploy(approveProxy.address, "0x0000000000000000000000000000000000000000", wnative))
    .then(c => c.deployed());

  const tokenValidChecker = await ethers
    .getContractFactory("TokenValidChecker")
    .then(f => f.deploy(routeProxy.address, approve.address))
    .then(c => c.deployed());

  const signer = (await ethers.getSigners())[0];
  await approve.init(signer.address, approveProxy.address);
  await approveProxy.init(signer.address, [routeProxy.address]);

  return {
    tokenValidChecker,
    routeProxy,
    uniV2Adapter,
    trashUniV2Adapter,
  };
};
