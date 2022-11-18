import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { loadConfig } from "../../config";
import type { Signers } from "../types";
import { deployViewersFixture } from "../viewers/viewers.fixtures";
import {
  ellipsisNativeToToken,
  ellipsisTokenToNative,
  ellipsisTokenToToken,
  impersonateTest,
  swapEllipsisAdapter,
  swapUniV2Adapter,
  univ2WnativeToToken,
} from "./adapters.behavior";
import { deployAdaptersFixture } from "./adapters.fixtures";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.config = await loadConfig(ethers);
  });

  describe("Adapters", function () {
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
      } = await loadFixture(deployAdaptersFixture);
      this.balancerAdapter = balancerAdapter;
      this.curveAdapter = curveAdapter;
      this.ellipsisAdapter = ellipsisAdapter;
      this.uniV2Adapter = uniV2Adapter;
      this.uniV3Adapter = uniV3Adapter;
      this.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
      this.stableSwapAdapter = stableSwapAdapter;
    });

    univ2WnativeToToken();
    ellipsisNativeToToken();
    ellipsisTokenToNative();
    ellipsisTokenToToken();
    // swapUniV2Adapter();
    // swapEllipsisAdapter();
    // impersonateTest();
  });
});
