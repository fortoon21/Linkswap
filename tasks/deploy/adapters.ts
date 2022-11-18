import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import { loadConfig } from "../../config";

task("deploy:Adapters").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const config = await loadConfig(ethers);

  // const balancerAdapter = await ethers
  //   .getContractFactory("BalancerAdapter")
  //   .then(f => f.deploy(config.WETH))
  //   .then(c => c.deployed());
  // console.log("BalancerAdapter deployed to: ", balancerAdapter.address);

  // for (const curveDex of config.CurveDexes) {
  //   if (curveDex.forkType == "curve") {
  //     const curveAdapter = await ethers
  //       .getContractFactory("CurveAdapter")
  //       .then(f =>
  //         f.deploy(
  //           config.WETH,
  //           curveDex.registry,
  //           curveDex.cryptoRegistry,
  //           curveDex.factoryRegistry,
  //           curveDex.cryptoFactoryRegistry,
  //         ),
  //       )
  //       .then(c => c.deployed());
  //     console.log("CurveAdapter deployed to: ", curveAdapter.address);
  //   } else if (curveDex.forkType == "ellipsis") {
  //     const ellipsisAdapter = await ethers
  //       .getContractFactory("EllipsisAdapter")
  //       .then(f => f.deploy(config.WETH, curveDex.registry));
  //     console.log("EllipsisAdapter deployed to: ", ellipsisAdapter.address);
  //   } else if (curveDex.forkType == "stableswap") {
  //     const stableSwapAdapter = await ethers
  //       .getContractFactory("StableSwapAdapter")
  //       .then(f => f.deploy(curveDex.registry, config.WETH))
  //       .then(c => c.deployed());
  //     console.log("StableSwapAdapter deployed to: ", stableSwapAdapter.address);
  //   }
  // }

  const meshAdapter = await ethers
    .getContractFactory("TrashUniV2Adapter")
    .then(f => f.deploy(config.Deployed.UniV2Viewer))
    .then(c => c.deployed());
  console.log("MeshAdapter deployed to: ", meshAdapter.address);

  const uniV2Adapter = await ethers
    .getContractFactory("UniV2Adapter")
    .then(f => f.deploy(config.Deployed.UniV2Viewer))
    .then(c => c.deployed());
  console.log("UniV2Adapter deployed to: ", uniV2Adapter.address);

  const uniV3Adapter = await ethers
    .getContractFactory("UniV3Adapter")
    .then(f => f.deploy(config.WETH))
    .then(c => c.deployed());
  console.log("UniV3Adapter deployed to: ", uniV3Adapter.address);

  // const stableSwapNoRegistryAdapter = await ethers
  //   .getContractFactory("StableSwapNoRegistryAdapter")
  //   .then(f => f.deploy())
  //   .then(c => c.deployed());
  // console.log("StableSwapNoRegistryAdapter deployed to: ", stableSwapNoRegistryAdapter.address);
});
