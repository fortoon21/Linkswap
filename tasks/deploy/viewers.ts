import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import { loadConfig } from "../../config";

task("deploy:Viewers").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const config = await loadConfig(ethers);

  // const balancerViewer = await ethers
  //   .getContractFactory("BalancerViewer")
  //   .then(f => f.deploy())
  //   .then(c => c.deployed());
  // console.log("BalancerViewer deployed to: ", balancerViewer.address);

  // for (const curveDex of config.CurveDexes) {
  //   if (curveDex.forkType == "curve") {
  //     const curveViewer = await ethers
  //       .getContractFactory("CurveViewer")
  //       .then(f => f.deploy(curveDex.registry, curveDex.factoryRegistry))
  //       .then(c => c.deployed());
  //     console.log("CurveViewer deployed to: ", curveViewer.address);
  //   } else if (curveDex.forkType == "ellipsis") {
  //     const ellipsisViewer = await ethers
  //       .getContractFactory("EllipsisViewer")
  //       .then(f => f.deploy(curveDex.registry))
  //       .then(c => c.deployed());
  //     console.log("EllipsisViewer deployed to: ", ellipsisViewer.address);
  //   } else {
  //     const stableSwapViewer = await ethers
  //       .getContractFactory("StableSwapViewer")
  //       .then(f => f.deploy())
  //       .then(c => c.deployed());
  //     console.log("StableSwapViewer deployed to: ", stableSwapViewer.address);
  //   }
  // }

  // for (const curveDex of config.CurveDexes) {
  //   if (curveDex.forkType !== "stableswap") {
  //     const curveCryptoViewer = await ethers
  //       .getContractFactory("CurveCryptoViewer")
  //       .then(f => f.deploy(curveDex.cryptoRegistry, curveDex.cryptoFactoryRegistry))
  //       .then(c => c.deployed());
  //     console.log("CurveCryptoViewer deployed to: ", curveCryptoViewer.address, curveDex.forkType);
  //   }
  // }

  // const uniV2Viewer = await ethers
  //   .getContractFactory("UniV2Viewer")
  //   .then(f =>
  //     f.deploy(
  //       config.Uni2Dexes.map(uni2 => uni2.factory),
  //       config.Uni2Dexes.map(uni2 => uni2.fee),
  //     ),
  //   )
  //   .then(c => c.deployed());
  // console.log("UniV2Viewer deployed to: ", uniV2Viewer.address);

  const uniV3Viewer = await ethers
    .getContractFactory("UniV3Viewer")
    .then(f => f.deploy())
    .then(c => c.deployed());
  console.log("UniV3Viewer deployed to: ", uniV3Viewer.address);

  // const tokenViewer = await ethers
  //   .getContractFactory("TokenViewer")
  //   .then(f => f.deploy())
  //   .then(c => c.deployed());
  // console.log("TokenViewer deployed to: ", tokenViewer.address);
});
