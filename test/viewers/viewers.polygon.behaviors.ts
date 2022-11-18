import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { logger } from "../logger";
import {
  testCommonViewerCurve,
  testCommonViewerCurveCrypto,
  testCommonViewerFetchToken,
  testCommonViewerUniV2,
  testCommonViewerUniV3,
} from "./viewers.common.behaviors";

export function testPolygonViewerFetchToken(): void {
  it("viewer-meta", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonViewerFetchToken: skip test");
      return;
    }
    const config = this.polygon.config;
    await testCommonViewerFetchToken(config.tokens.wnative, this.polygon.tokenViewer);
  });
}

export function testPolygonViewerUniV2(): void {
  it("viewer-uni2", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonViewerUniV2: skip test");
      return;
    }
    const config = this.polygon.config;
    await testCommonViewerUniV2(config.uni2Dexes, this.polygon.uniV2Viewer);
  });
}

export function testPolygonViewerUniV3(): void {
  it("viewer-uni3", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonViewerUniV3: skip test");
      return;
    }
    const config = this.polygon.config;
    await testCommonViewerUniV3(config.uni3Pools.poolWnativeUsdc, this.polygon.uniV3Viewer);
  });
}

export function testPolygonViewerCurve(): void {
  it("viewer-curve", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonViewerCurve: skip test");
      return;
    }
    const config = this.polygon.config;
    await testCommonViewerCurve(this.polygon.curveViewers);
  });
}

export function testPolygonViewerCurveCrypto(): void {
  it("viewer-curveCrypto", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonViewerCurveCrypto: skip test");
      return;
    }
    const config = this.polygon.config;
    await testCommonViewerCurveCrypto(this.polygon.curveCryptoViewers);
  });
}

export function testPolygonViewerBalancer(): void {
  it("viewer-balancer", async function () {
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonViewerBalancer: skip test");
      return;
    }
    const config = this.polygon.config;
    // test code ...
  });
}
