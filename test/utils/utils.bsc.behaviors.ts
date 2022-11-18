import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { BscConfig } from "../../config/bsc_config";
import { bscGrayTokens } from "../../config/bsc_gray_tokens";
import { polygonGrayTokens } from "../../config/polygon_gray_tokens";
import { logger } from "../logger";
import { testCommonTokenValidChecker } from "./utils.common.behaviors";

/* ========================================================
 * new code
 * ======================================================== */
export function testBscTokenValidChecker() {
  it("check-token-0", async function () {
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscTokenValidChecker: skip test");
      return;
    }

    const signer = this.bscUtil.signers.admin;
    const tokenValidChecker = this.bscUtil.tokenValidChecker;
    const factorys = this.bscUtil.config.uni2Dexes.map(e => e.factory);
    const univ2 = this.bscUtil.uniV2Adapter;
    const trashUniv2 = this.bscUtil.trashUniV2Adapter;
    const poolEdition = 0;
    const wnative = this.bscUtil.config.tokens.wnative;
    const amountIn = ethers.utils.parseEther("10");
    const numChunk = 10;

    await testCommonTokenValidChecker(
      signer,
      tokenValidChecker,
      factorys[0],
      univ2,
      poolEdition,
      wnative,
      // bscGrayTokens.slice(0, 10),
      ["0x547cbe0f0c25085e7015aa6939b28402eb0ccdac"],
      `analysis/bsc/0-tokenValidChecker.json`,
      amountIn,
      numChunk,
    );
  });

  it("check-token-1", async function () {
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscTokenValidChecker: skip test");
      return;
    }

    const signer = this.bscUtil.signers.admin;
    const tokenValidChecker = this.bscUtil.tokenValidChecker;
    const factorys = this.bscUtil.config.uni2Dexes.map(e => e.factory);
    const univ2 = this.bscUtil.uniV2Adapter;
    const trashUniv2 = this.bscUtil.trashUniV2Adapter;
    const poolEdition = 0;
    const wnative = this.bscUtil.config.tokens.wnative;
    const amountIn = ethers.utils.parseEther("10");
    const numChunk = 10;

    await testCommonTokenValidChecker(
      signer,
      tokenValidChecker,
      factorys[1],
      univ2,
      poolEdition,
      wnative,
      bscGrayTokens,
      `analysis/bsc/1-tokenValidChecker.json`,
      amountIn,
      numChunk,
    );
  });
}
