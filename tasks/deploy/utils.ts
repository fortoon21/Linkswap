import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import { loadConfig } from "../../config";
import { logger } from "../../test/logger";

task("deploy:TokenValidChecker").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  logger.log("deploy:TokenValidChecker");
  const config = await loadConfig(ethers);
  const tokenValidChecker = await ethers
    .getContractFactory("TokenValidChecker")
    .then(f => f.deploy(config.Deployed.RouteProxy, config.Deployed.Approve))
    .then(c => c.deployed());

  logger.log(`tokenValidChecker deployed to: ${tokenValidChecker.address}`);
});
