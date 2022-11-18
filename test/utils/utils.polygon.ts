import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { polygonConfig } from "../../config/matic_config";
import { logger } from "../logger";
import type { PolygonUtilContext, Signers } from "../types";
import { testPolygonTokenValidChecker } from "./utils.polygon.behaviors";
import { fixturePolygonTokenValidChecker } from "./utils.polygon.fixtures";

describe("/* ---------------------------- route (polygon) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Polygon;
    if (!valid) {
      logger.log("route (polygon) > before: skip polygon");
    }
    /* ---------------------------- 1 ---------------------------- */
    const polygonUtil = {} as PolygonUtilContext;
    polygonUtil.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    polygonUtil.signers.admin = signers[0];
    polygonUtil.config = polygonConfig;
    /* ---------------------------- 2 ---------------------------- */
    const { tokenValidChecker, routeProxy, uniV2Adapter, trashUniV2Adapter } = await loadFixture(
      fixturePolygonTokenValidChecker,
    );
    polygonUtil.tokenValidChecker = tokenValidChecker;
    polygonUtil.routeProxy = routeProxy;
    polygonUtil.uniV2Adapter = uniV2Adapter;
    polygonUtil.trashUniV2Adapter = trashUniV2Adapter;
    this.polygonUtil = polygonUtil;
  });

  testPolygonTokenValidChecker();
});
