import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { BscConfig, bscConfig } from "../../config/bsc_config";
import { logger } from "../logger";
import type { BscContext, Signers } from "../types";
import { fixtureBscViewer } from "../viewers/viewers.bsc.fixtures";
import {
  testBscAdapterEllipsisLpToNative,
  testBscAdapterEllipsisLpToToken,
  testBscAdapterEllipsisNativeToLp,
  testBscAdapterEllipsisNativeToToken,
  testBscAdapterEllipsisTokenToLp,
  testBscAdapterEllipsisTokenToNative,
  testBscAdapterEllipsisTokenToToken,
  testBscAdapterUniv2WnativeToToken,
} from "./adapters.bsc.behaviors";
// import { adapterBscTestUniv2WnativeToToken } from "./adapters.bsc.behavior";
import { fixtureBscAdapter } from "./adapters.bsc.fixtures";

describe("/* ---------------------------- adapter (bsc) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Bsc;
    if (!valid) {
      logger.log("adapter (bsc) > before: skip bsc");
      return;
    }

    /* ---------------------------- 1 ---------------------------- */
    const bsc = {} as BscContext;
    bsc.signers = {} as Signers;
    const signers: SignerWithAddress[] = await ethers.getSigners();
    bsc.signers.admin = signers[0];
    bsc.config = bscConfig;

    /* ---------------------------- 2 ---------------------------- */
    const { balancerViewer, curveViewers, uniV2Viewer, uniV3Viewers, tokenViewer } = await loadFixture(
      fixtureBscViewer,
    );
    bsc.tokenViewer = tokenViewer;
    bsc.balancerViewer = balancerViewer;
    bsc.curveViewers = curveViewers;
    bsc.uniV2Viewer = uniV2Viewer;
    bsc.uniV3Viewers = uniV3Viewers;

    const {
      balancerAdapter,
      curveAdapter,
      ellipsisAdapter,
      uniV2Adapter,
      uniV3Adapter,
      stableSwapNoRegistryAdapter,
      stableSwapAdapter,
    } = await loadFixture(fixtureBscAdapter);
    bsc.balancerAdapter = balancerAdapter;
    bsc.curveAdapter = curveAdapter;
    bsc.ellipsisAdapter = ellipsisAdapter;
    bsc.uniV2Adapter = uniV2Adapter;
    bsc.uniV3Adapter = uniV3Adapter;
    bsc.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
    bsc.stableSwapAdapter = stableSwapAdapter;

    this.bsc = bsc;
  });

  // beforeEach(async function () {
  //   /* ---------------------------- 1 ---------------------------- */
  //   const bsc = {} as BscContext;
  //   bsc.signers = {} as Signers;
  //   const signers: SignerWithAddress[] = await ethers.getSigners();
  //   bsc.signers.admin = signers[0];
  //   bsc.config = bscConfig;

  //   /* ---------------------------- 2 ---------------------------- */
  //   // composit fixture (non-anonymous)
  //   async function fixture() {
  //     return { ...(await fixtureBscViewer()), ...(await fixtureBscAdapter()) };
  //   }
  //   const {
  //     balancerViewer,
  //     curveViewers,
  //     uniV2Viewer,
  //     uniV3Viewers,
  //     tokenViewer,
  //     //
  //     balancerAdapter,
  //     curveAdapter,
  //     ellipsisAdapter,
  //     uniV2Adapter,
  //     uniV3Adapter,
  //     stableSwapNoRegistryAdapter,
  //     stableSwapAdapter,
  //   } = await loadFixture(fixture);
  //   bsc.tokenViewer = tokenViewer;
  //   bsc.balancerViewer = balancerViewer;
  //   bsc.curveViewers = curveViewers;
  //   bsc.uniV2Viewer = uniV2Viewer;
  //   bsc.uniV3Viewers = uniV3Viewers;
  //   //
  //   bsc.balancerAdapter = balancerAdapter;
  //   bsc.curveAdapter = curveAdapter;
  //   bsc.ellipsisAdapter = ellipsisAdapter;
  //   bsc.uniV2Adapter = uniV2Adapter;
  //   bsc.uniV3Adapter = uniV3Adapter;
  //   bsc.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
  //   bsc.stableSwapAdapter = stableSwapAdapter;

  //   this.bsc = bsc;
  // });

  testBscAdapterUniv2WnativeToToken();
  testBscAdapterEllipsisNativeToToken();
  testBscAdapterEllipsisTokenToNative();
  testBscAdapterEllipsisTokenToToken();
  testBscAdapterEllipsisTokenToLp();
  testBscAdapterEllipsisLpToToken();
  testBscAdapterEllipsisNativeToLp();
  testBscAdapterEllipsisLpToNative();
});
