import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { loadConfig } from "../../config";
import type { Signers } from "../types";
import { fetchBalancerViewer, fetchCurveViewer, fetchTokenViewer, fetchUniV2Viewer } from "./viewers.behavior";
import { deployViewersFixture } from "./viewers.fixtures";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.config = await loadConfig(ethers);
  });

  describe("Viewers", function () {
    beforeEach(async function () {
      const { balancerViewer, curveViewers, uniV2Viewer, uniV3Viewer, tokenViewer } = await loadFixture(
        deployViewersFixture,
      );
      this.tokenViewer = tokenViewer;
      this.balancerViewer = balancerViewer;
      this.curveViewers = curveViewers;
      this.uniV2Viewer = uniV2Viewer;
      this.uniV3Viewer = uniV3Viewer;
    });

    fetchTokenViewer();
    fetchUniV2Viewer();
    fetchCurveViewer();
    fetchBalancerViewer();
  });
});
