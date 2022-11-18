import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { bscConfig } from "../../config/bsc_config";
import { logger } from "../logger";
import type { BscUtilContext, Signers } from "../types";
import { testBscTokenValidChecker } from "./utils.bsc.behaviors";
import { fixtureBscTokenValidChecker } from "./utils.bsc.fixtures";

describe("/* ---------------------------- route (bsc) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Bsc;
    if (!valid) {
      logger.log("route (bsc) > before: skip bsc");
    }
    /* ---------------------------- 1 ---------------------------- */
    const bscUtil = {} as BscUtilContext;
    bscUtil.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    bscUtil.signers.admin = signers[0];
    bscUtil.config = bscConfig;
    /* ---------------------------- 2 ---------------------------- */
    const { tokenValidChecker, routeProxy, uniV2Adapter, trashUniV2Adapter } = await loadFixture(
      fixtureBscTokenValidChecker,
    );
    bscUtil.tokenValidChecker = tokenValidChecker;
    bscUtil.routeProxy = routeProxy;
    bscUtil.uniV2Adapter = uniV2Adapter;
    bscUtil.trashUniV2Adapter = trashUniV2Adapter;
    this.bscUtil = bscUtil;
  });

  testBscTokenValidChecker();
});
