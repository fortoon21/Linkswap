import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import * as util from "util";

import { loadConfig } from "../config";
import { logger } from "../test/logger";

task("quote:test").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const config = await loadConfig(ethers);

  const signers: SignerWithAddress[] = await ethers.getSigners();
  const input = ethers.utils.parseUnits("1", 18).toString();

  console.log("From 1 matic to USDC");

  const uniV3AdapterFactory = await ethers.getContractFactory("UniV3Adapter");
  const txBytes = uniV3AdapterFactory.interface.encodeFunctionData("getAmountOut", [
    config.Tokens.WMATIC.address,
    ethers.BigNumber.from("1000000000000000000"),
    config.Tokens.USDC.address,
    "0xA374094527e1673A86dE625aa59517c5dE346d32",
  ]) as string;
  logger.log(
    await signers[0].call({
      to: config.Deployed.UniV3Adapter,
      from: signers[0].address,
      data: txBytes,
      value: input,
    }),
  );
});
