import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { logger } from "../logger";
import { testCommonViewerCurve, testCommonViewerFetchToken, testCommonViewerUniV2 } from "./viewers.common.behaviors";

export function testBscViewerFetchToken(): void {
  it("viewer-meta", async function () {
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscViewerFetchToken: skip test");
      return;
    }
    const config = this.bsc.config;
    await testCommonViewerFetchToken(config.tokens.wnative, this.bsc.tokenViewer);
  });
}

export function testBscViewerUniV2(): void {
  it("viewer-uni2", async function () {
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscViewerUniV2: skip test");
      return;
    }
    const config = this.bsc.config;
    await testCommonViewerUniV2(config.uni2Dexes, this.bsc.uniV2Viewer);
  });
}

export function testBscViewerCurve(): void {
  it("viewer-curve", async function () {
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscViewerCurve: skip test");
      return;
    }
    const config = this.bsc.config;
    await testCommonViewerCurve(this.bsc.curveViewers);
  });
}

export function testBscViewerBalancer(): void {
  it("viewer-balancer", async function () {
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscViewerBalancer: skip test");
      return;
    }
    const config = this.bsc.config;
    // test code ...
  });
}
