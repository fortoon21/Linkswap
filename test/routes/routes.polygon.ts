import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, network } from "hardhat";

import { Chain, getChain } from "../../config";
import { polygonConfig } from "../../config/matic_config";
import { getChainConfig } from "../../hardhat.config";
import { logger } from "../logger";
import type { PolygonContext, Signers } from "../types";
import { fixturePolygonViewer } from "../viewers/viewers.polygon.fixtures";
import {
  testPolygonMeshswapRouteUniv2NativeToToken as testPolygonRouteTrashUniv2NativeToToken,
  testPolygonMeshswapRouteUniv2TokenToNative as testPolygonRouteTrashUniv2TokenToNative,
  testPolygonMeshswapRouteUniv2TokenToToken as testPolygonRouteTrashUniv2TokenToToken,
  testPolygonRouteUniv2NativeToToken,
  testPolygonRouteUniv2TokenToNative,
  testPolygonRouteUniv2TokenToToken,
  testPolygonSplitRouteNativeToToken,
} from "./routes.polygon.behaviors";
import { fixturePolygonRoute } from "./routes.polygon.fixtures";

describe("/* ---------------------------- route (polygon) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Polygon;
    if (!valid) {
      logger.log("route (polygon) > before: skip polygon");
    }
    /* ---------------------------- 1 ---------------------------- */
    const polygon = {} as PolygonContext;
    polygon.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    polygon.signers.admin = signers[0];
    polygon.config = polygonConfig;
    /* ---------------------------- 2 ---------------------------- */
    const { balancerViewer, curveViewers, uniV2Viewer, uniV3Viewer, tokenViewer } = await loadFixture(
      fixturePolygonViewer,
    );
    polygon.tokenViewer = tokenViewer;
    polygon.balancerViewer = balancerViewer;
    polygon.curveViewers = curveViewers;
    polygon.uniV2Viewer = uniV2Viewer;
    polygon.uniV3Viewer = uniV3Viewer;

    const {
      balancerAdapter,
      curveAdapter,
      ellipsisAdapter,
      uniV2Adapter,
      uniV3Adapter,
      trashUniV2Adapter,
      stableSwapNoRegistryAdapter,
      stableSwapAdapter,
      routeProxy,
      approveProxy,
      approve,
    } = await loadFixture(fixturePolygonRoute);
    polygon.balancerAdapter = balancerAdapter;
    polygon.curveAdapter = curveAdapter;
    polygon.uniV2Adapter = uniV2Adapter;
    polygon.uniV3Adapter = uniV3Adapter;
    polygon.trashUniV2Adapter = trashUniV2Adapter;
    polygon.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
    polygon.stableSwapAdapter = stableSwapAdapter;
    polygon.routeProxy = routeProxy;
    polygon.approveProxy = approveProxy;
    polygon.approve = approve;

    this.polygon = polygon;
  });

  testPolygonSplitRouteNativeToToken();

  testPolygonRouteTrashUniv2NativeToToken();
  testPolygonRouteTrashUniv2TokenToNative();
  testPolygonRouteTrashUniv2TokenToToken();

  testPolygonRouteUniv2NativeToToken();
  testPolygonRouteUniv2TokenToNative();
  testPolygonRouteUniv2TokenToToken();
});
