import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import { Chain, getChain, loadConfig } from "../../config";

task("deploy:Route").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const config = await loadConfig(ethers);
  const [signer] = await ethers.getSigners();
  const chain = await getChain(ethers);

  const approve = await ethers
    .getContractFactory("Approve")
    .then(f => f.deploy())
    .then(c => c.deployed());
  console.log("Approve deployed to: ", approve.address);

  const approveProxy = await ethers
    .getContractFactory("ApproveProxy")
    .then(f => f.deploy(approve.address))
    .then(c => c.deployed());
  console.log("ApproveProxy deployed to: ", approveProxy.address);

  const tokenAddrs = config.Oracles.map(e => e.coin);
  const oracleAddrs = config.Oracles.map(e => e.oracle);

  if (chain === Chain.Polygon) {
    const routeProxy = await ethers
      .getContractFactory("RouteProxyPolygon")
      .then(f => f.deploy(approveProxy.address, config.FlashloanSwap, config.WETH, tokenAddrs, oracleAddrs))
      .then(c => c.deployed());
    console.log("RouteProxy deployed to: ", routeProxy.address);
    await approve.init(signer.address, approveProxy.address);
    await approveProxy.init(signer.address, [routeProxy.address]);
  } else if (chain === Chain.Bsc) {
    const routeProxy = await ethers
      .getContractFactory("RouteProxyBSC")
      .then(f => f.deploy(approveProxy.address, config.FlashloanSwap, config.WETH, tokenAddrs, oracleAddrs))
      .then(c => c.deployed());
    console.log("RouteProxy deployed to: ", routeProxy.address);
    await approve.init(signer.address, approveProxy.address);
    await approveProxy.init(signer.address, [routeProxy.address]);
  } else {
    throw new Error("deploy:Route: unsupported chain");
  }
});
