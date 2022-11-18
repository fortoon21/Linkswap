import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, network } from "hardhat";

import { Chain, getChain } from "../../config";
import { bscConfig } from "../../config/bsc_config";
import { getChainConfig } from "../../hardhat.config";
import { logger } from "../logger";
import type { BscContext, Signers } from "../types";
import { fixtureBscViewer } from "../viewers/viewers.bsc.fixtures";
import {
  testBscRouteEllipsisNativeToToken,
  testBscRouteEllipsisTokenToNative,
  testBscRouteEllipsisTokenToToken,
  testBscRouteShieldSwapNativeToToken,
  testBscRouteUniv2NativeToToken,
  testBscRouteUniv2TokenToNative,
  testBscRouteUniv2TokenToToken,
} from "./routes.bsc.behaviors";
import { fixtureBscRoute } from "./routes.bsc.fixtures";

describe("/* ---------------------------- route (bsc) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Bsc;
    if (!valid) {
      logger.log("route (bsc) > before: skip bsc");
      return;
    }
    /* ---------------------------- 1 ---------------------------- */
    const bsc = {} as BscContext;
    bsc.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    bsc.signers.admin = signers[0];
    bsc.config = bscConfig;
    /* ---------------------------- 2 ---------------------------- */
    const { balancerViewer, curveViewers, uniV2Viewer, uniV3Viewer, tokenViewer } = await loadFixture(fixtureBscViewer);
    bsc.tokenViewer = tokenViewer;
    bsc.balancerViewer = balancerViewer;
    bsc.curveViewers = curveViewers;
    bsc.uniV2Viewer = uniV2Viewer;
    bsc.uniV3Viewer = uniV3Viewer;

    const {
      balancerAdapter,
      curveAdapter,
      ellipsisAdapter,
      uniV2Adapter,
      uniV3Adapter,
      stableSwapNoRegistryAdapter,
      stableSwapAdapter,
      routeProxy,
      approveProxy,
      approve,
    } = await loadFixture(fixtureBscRoute);
    bsc.balancerAdapter = balancerAdapter;
    bsc.curveAdapter = curveAdapter;
    bsc.ellipsisAdapter = ellipsisAdapter;
    bsc.uniV2Adapter = uniV2Adapter;
    bsc.uniV3Adapter = uniV3Adapter;
    bsc.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
    bsc.stableSwapAdapter = stableSwapAdapter;
    bsc.routeProxy = routeProxy;
    bsc.approveProxy = approveProxy;
    bsc.approve = approve;

    this.bsc = bsc;
  });

  // before(async function () {
  //   // /* ---------------------------- 0 ---------------------------- */
  //   // await network.provider.request({
  //   //   method: "hardhat_reset",
  //   //   params: [
  //   //     {
  //   //       forking: {
  //   //         jsonRpcUrl: getChainConfig("bsc-mainnet").url,
  //   //         // blockNumber: 22840000,
  //   //       },
  //   //     },
  //   //   ],
  //   // });
  //   /* ---------------------------- 1 ---------------------------- */
  //   const bsc = {} as BscContext;
  //   bsc.signers = {} as Signers;

  //   const signers: SignerWithAddress[] = await ethers.getSigners();
  //   bsc.signers.admin = signers[0];
  //   bsc.config = bscConfig;
  //   /* ---------------------------- 2 ---------------------------- */
  //   // composit fixture (non-anonymous)
  //   async function fixture() {
  //     return { ...(await fixtureBscRoute()), ...(await fixtureBscViewer()) };
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
  //     routeProxy,
  //     approveProxy,
  //     approve,
  //   } = await loadFixture(fixture);

  //   bsc.tokenViewer = tokenViewer;
  //   bsc.balancerViewer = balancerViewer;
  //   bsc.curveViewers = curveViewers;
  //   bsc.uniV2Viewer = uniV2Viewer;
  //   bsc.uniV3Viewers = uniV3Viewers;

  //   bsc.balancerAdapter = balancerAdapter;
  //   bsc.curveAdapter = curveAdapter;
  //   bsc.ellipsisAdapter = ellipsisAdapter;
  //   bsc.uniV2Adapter = uniV2Adapter;
  //   bsc.uniV3Adapter = uniV3Adapter;
  //   bsc.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
  //   bsc.stableSwapAdapter = stableSwapAdapter;
  //   bsc.routeProxy = routeProxy;
  //   bsc.approveProxy = approveProxy;
  //   bsc.approve = approve;

  //   this.bsc = bsc;
  // });

  testBscRouteShieldSwapNativeToToken();

  testBscRouteUniv2NativeToToken();
  testBscRouteUniv2TokenToNative();
  testBscRouteUniv2TokenToToken();
  testBscRouteEllipsisNativeToToken();
  testBscRouteEllipsisTokenToNative();
  testBscRouteEllipsisTokenToToken();
});
