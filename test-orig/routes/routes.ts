import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { loadConfig } from "../../config";
import type { Signers } from "../types";
import { deployViewersFixture } from "../viewers/viewers.fixtures";
import { univ2NativeToToken } from "./routes.behaviors";
import { deployRoutesFixture } from "./routes.fixtures";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.config = await loadConfig(ethers);
  });

  describe("Routes", function () {
    before(async function () {
      const { balancerViewer, curveViewers, uniV2Viewer, uniV3Viewer, tokenViewer } = await loadFixture(
        deployViewersFixture,
      );
      this.tokenViewer = tokenViewer;
      this.balancerViewer = balancerViewer;
      this.curveViewers = curveViewers;
      this.uniV2Viewer = uniV2Viewer;
      this.uniV3Viewer = uniV3Viewer;

      const {
        balancerAdapter,
        curveAdapter,
        ellipsisAdapter,
        uniV2Adapter,
        uniV3Adapter,
        stableSwapNoRegistryAdapter,
        stableSwapAdapter,
        routeProxy,
      } = await loadFixture(deployRoutesFixture);
      this.balancerAdapter = balancerAdapter;
      this.curveAdapter = curveAdapter;
      this.ellipsisAdapter = ellipsisAdapter;
      this.uniV2Adapter = uniV2Adapter;
      this.uniV3Adapter = uniV3Adapter;
      this.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
      this.stableSwapAdapter = stableSwapAdapter;
      this.routeProxy = routeProxy;
    });

    univ2NativeToToken();
  });
});
