import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { polygonConfig } from "../../config/matic_config";
import { logger } from "../logger";
import type { PolygonContext, Signers } from "../types";
import {
  testPolygonViewerBalancer,
  testPolygonViewerCurve,
  testPolygonViewerCurveCrypto,
  testPolygonViewerFetchToken,
  testPolygonViewerUniV2,
  testPolygonViewerUniV3,
} from "./viewers.polygon.behaviors";
import { fixturePolygonViewer } from "./viewers.polygon.fixtures";

describe("/* ---------------------------- viewer (polygon) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Polygon;
    if (!valid) {
      logger.log("viewer (polygon) > before: skip polygon");
      return;
    }
    /* ----------------------------  ---------------------------- */
    const polygon = {} as PolygonContext;
    polygon.signers = {} as Signers;
    const signers: SignerWithAddress[] = await ethers.getSigners();
    polygon.signers.admin = signers[0];
    polygon.config = polygonConfig;

    /* ----------------------------  ---------------------------- */
    const { balancerViewer, curveViewers, uniV2Viewer, uniV3Viewer, tokenViewer, curveCryptoViewers } =
      await loadFixture(fixturePolygonViewer);
    polygon.tokenViewer = tokenViewer;
    polygon.balancerViewer = balancerViewer;
    polygon.curveViewers = curveViewers;
    polygon.curveCryptoViewers = curveCryptoViewers;
    polygon.uniV2Viewer = uniV2Viewer;
    polygon.uniV3Viewer = uniV3Viewer;

    this.polygon = polygon;
  });

  testPolygonViewerFetchToken();
  testPolygonViewerUniV2();
  testPolygonViewerUniV3();
  testPolygonViewerCurve();
  testPolygonViewerCurveCrypto();
  testPolygonViewerBalancer();
});
