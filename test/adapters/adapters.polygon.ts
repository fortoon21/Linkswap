import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { polygonConfig } from "../../config/matic_config";
import { logger } from "../logger";
import type { PolygonContext, Signers } from "../types";
import { fixturePolygonViewer } from "../viewers/viewers.polygon.fixtures";
import {
  testPolygonAdapterBalancerNativeToToken,
  testPolygonAdapterBalancerTokenToNative,
  testPolygonAdapterBalancerTokenToToken,
  testPolygonAdapterCurveLpToToken,
  testPolygonAdapterCurveNativeToToken,
  testPolygonAdapterCurveTokenToLp,
  testPolygonAdapterCurveTokenToNative,
  testPolygonAdapterCurveTokenToToken,
  testPolygonAdapterMMUniv2WnativeToToken,
  testPolygonAdapterMeshswapUniv2WnativeToToken,
  testPolygonAdapterQuickswapUniv2WnativeToToken,
  testPolygonAdapterTrashUniv2WnativeToToken,
  testPolygonAdapterUniv2WnativeToToken,
  testPolygonAdapterUniv3WnativeToToken,
} from "./adapters.polygon.behaviors";
import { fixturePolygonAdapter } from "./adapters.polygon.fixtures";

describe("/* ---------------------------- adapter (polygon) ---------------------------- */", function () {
  before(async function () {
    const valid = (await getChain(ethers)) === Chain.Polygon;
    if (!valid) {
      logger.log("adapter (polygon) > before: skip polygon");
      return;
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
      uniV2Adapter,
      trashUniV2Adapter,
      uniV3Adapter,
      stableSwapNoRegistryAdapter,
      stableSwapAdapter,
    } = await loadFixture(fixturePolygonAdapter);
    polygon.balancerAdapter = balancerAdapter;
    polygon.curveAdapter = curveAdapter;
    polygon.uniV2Adapter = uniV2Adapter;
    polygon.trashUniV2Adapter = trashUniV2Adapter;
    polygon.uniV3Adapter = uniV3Adapter;
    polygon.stableSwapNoRegistryAdapter = stableSwapNoRegistryAdapter;
    polygon.stableSwapAdapter = stableSwapAdapter;

    this.polygon = polygon;
  });

  testPolygonAdapterTrashUniv2WnativeToToken();
  testPolygonAdapterMeshswapUniv2WnativeToToken();
  testPolygonAdapterQuickswapUniv2WnativeToToken();
  testPolygonAdapterMMUniv2WnativeToToken();

  testPolygonAdapterUniv3WnativeToToken();

  testPolygonAdapterUniv2WnativeToToken();
  testPolygonAdapterCurveNativeToToken();
  testPolygonAdapterCurveTokenToNative();
  testPolygonAdapterCurveTokenToToken();
  testPolygonAdapterCurveTokenToLp();
  testPolygonAdapterCurveLpToToken();
  testPolygonAdapterBalancerNativeToToken();
  testPolygonAdapterBalancerTokenToNative();
  testPolygonAdapterBalancerTokenToToken();
});
