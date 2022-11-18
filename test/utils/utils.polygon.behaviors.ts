import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { PolygonConfig } from "../../config/matic_config";
import { polygonGrayTokens } from "../../config/polygon_gray_tokens";
import { logger } from "../logger";
import { testCommonTokenValidChecker } from "./utils.common.behaviors";

/* ========================================================
 * new code
 * ======================================================== */
export function testPolygonTokenValidChecker() {
  it("check-token-0", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonTokenValidChecker: skip test");
      return;
    }

    const signer = this.polygonUtil.signers.admin;
    const tokenValidChecker = this.polygonUtil.tokenValidChecker;
    const factorys = this.polygonUtil.config.uni2Dexes.map(e => e.factory);
    const univ2 = this.polygonUtil.uniV2Adapter;
    const trashUniv2 = this.polygonUtil.trashUniV2Adapter;
    const poolEdition = 0;
    const wnative = this.polygonUtil.config.tokens.wnative;
    const amountIn = ethers.utils.parseEther("10");
    const numChunk = 10;

    await testCommonTokenValidChecker(
      signer,
      tokenValidChecker,
      factorys[0],
      univ2,
      poolEdition,
      wnative,
      polygonGrayTokens,
      `analysis/polygon/0-tokenValidChecker.json`,
      amountIn,
      numChunk,
    );
  });

  it("check-token-1", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonTokenValidChecker: skip test");
      return;
    }

    const signer = this.polygonUtil.signers.admin;
    const tokenValidChecker = this.polygonUtil.tokenValidChecker;
    const factorys = this.polygonUtil.config.uni2Dexes.map(e => e.factory);
    const univ2 = this.polygonUtil.uniV2Adapter;
    const trashUniv2 = this.polygonUtil.trashUniV2Adapter;
    const poolEdition = 0;
    const wnative = this.polygonUtil.config.tokens.wnative;
    const amountIn = ethers.utils.parseEther("10");
    const numChunk = 10;

    await testCommonTokenValidChecker(
      signer,
      tokenValidChecker,
      factorys[1],
      univ2,
      poolEdition,
      wnative,
      polygonGrayTokens,
      `analysis/polygon/1-tokenValidChecker.json`,
      amountIn,
      numChunk,
    );
  });

  it("check-token-2", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonTokenValidChecker: skip test");
      return;
    }

    const signer = this.polygonUtil.signers.admin;
    const tokenValidChecker = this.polygonUtil.tokenValidChecker;
    const factorys = this.polygonUtil.config.uni2Dexes.map(e => e.factory);
    const univ2 = this.polygonUtil.uniV2Adapter;
    const trashUniv2 = this.polygonUtil.trashUniV2Adapter;
    const poolEdition = 2;
    const wnative = this.polygonUtil.config.tokens.wnative;
    const amountIn = ethers.utils.parseEther("10");
    const numChunk = 10;

    await testCommonTokenValidChecker(
      signer,
      tokenValidChecker,
      factorys[2],
      trashUniv2,
      poolEdition,
      wnative,
      polygonGrayTokens,
      `analysis/polygon/2-tokenValidChecker.json`,
      amountIn,
      numChunk,
    );
  });

  it("check-token-3", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonTokenValidChecker: skip test");
      return;
    }

    const signer = this.polygonUtil.signers.admin;
    const tokenValidChecker = this.polygonUtil.tokenValidChecker;
    const factorys = this.polygonUtil.config.uni2Dexes.map(e => e.factory);
    const univ2 = this.polygonUtil.uniV2Adapter;
    const trashUniv2 = this.polygonUtil.trashUniV2Adapter;
    const poolEdition = 0;
    const wnative = this.polygonUtil.config.tokens.wnative;
    const amountIn = ethers.utils.parseEther("10");
    const numChunk = 10;

    await testCommonTokenValidChecker(
      signer,
      tokenValidChecker,
      factorys[3],
      univ2,
      poolEdition,
      wnative,
      polygonGrayTokens,
      `analysis/polygon/3-tokenValidChecker.json`,
      amountIn,
      numChunk,
    );
  });
}
