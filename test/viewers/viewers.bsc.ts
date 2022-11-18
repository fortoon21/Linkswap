import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { bscConfig } from "../../config/bsc_config";
import { logger } from "../logger";
import type { BscContext, Signers } from "../types";
import {
  testBscViewerBalancer,
  testBscViewerCurve,
  testBscViewerFetchToken,
  testBscViewerUniV2,
} from "./viewers.bsc.behaviors";
import { fixtureBscViewer } from "./viewers.bsc.fixtures";

describe("/* ---------------------------- viewer (bsc) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Bsc;
    if (!valid) {
      logger.log("viewer (bsc) > before: skip bsc");
      return;
    }
    /* ----------------------------  ---------------------------- */
    const bsc = {} as BscContext;
    bsc.signers = {} as Signers;
    const signers: SignerWithAddress[] = await ethers.getSigners();
    bsc.signers.admin = signers[0];
    bsc.config = bscConfig;

    /* ----------------------------  ---------------------------- */
    const { balancerViewer, curveViewers, uniV2Viewer, uniV3Viewer, tokenViewer } = await loadFixture(fixtureBscViewer);
    bsc.tokenViewer = tokenViewer;
    bsc.balancerViewer = balancerViewer;
    bsc.curveViewers = curveViewers;
    bsc.uniV2Viewer = uniV2Viewer;
    bsc.uniV3Viewer = uniV3Viewer;

    this.bsc = bsc;
  });

  testBscViewerFetchToken();
  testBscViewerUniV2();
  testBscViewerCurve();
  testBscViewerBalancer();
});
