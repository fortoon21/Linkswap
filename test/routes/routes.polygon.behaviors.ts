import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { PolygonConfig } from "../../config/matic_config";
import { logger } from "../logger";
import {
  testCommonRouteEllipsisNativeToToken,
  testCommonRouteEllipsisTokenToNative,
  testCommonRouteEllipsisTokenToToken,
  testCommonRouteShieldSwapNativeToToken,
  testCommonRouteUniv2NativeToToken,
  testCommonRouteUniv2TokenToNative,
  testCommonRouteUniv2TokenToToken,
  testCommonSplitRouteNativeToToken,
} from "./routes.common.behaviors";

export function testPolygonSplitRouteNativeToToken() {
  it("split-route-native-token", async function () {
    /**
     * adapter: univ2
     * fromToken: native
     * toToken: usdc
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonSplitRouteNativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const routeProxy = this.polygon.routeProxy;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.usdc;

    const response = await axios.post(`${process.env.API_SERVER_ENDPOINT}/v1/quote/calculate`, {
      options: {
        tokenInAddr: fromTokenAddr,
        tokenOutAddr: toTokenAddr,
        from: signer.address,
        amount: ethers.utils.parseEther("1").toString(),
        slippageBps: 100,
        maxEdge: 4,
        maxSplit: 1,
        withCycle: true,
      },
    });
    const txBytes = response.data.metamaskSwapTransaction.data as string;

    const expectedAmountOut = BigNumber.from(response.data.dexAgg.expectedAmountOut);
    console.log("Expected by quoteserver: ", ethers.utils.formatUnits(expectedAmountOut, 6), "USDC");

    this.polygon.routeProxy.interface;

    const args = this.polygon.routeProxy.interface.decodeFunctionData("shieldSwap", txBytes);
    logger.log(args.linearWeightPathInfo[0].weightedSwaps);
    logger.log(args.flashDes);
    logger.log(response.data.metamaskSwapTransaction.estimatedGas);

    await testCommonSplitRouteNativeToToken(
      signer,
      routeProxy,
      args.linearWeightPathInfo,
      args.flashDes,
      fromTokenAddr,
      toTokenAddr,
    );
  });
}

export function testPolygonRouteUniv2NativeToToken() {
  it("route-univ2-native-token", async function () {
    /**
     * adapter: univ2
     * fromToken: native
     * toToken: usdc
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonRouteUniv2NativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const routeProxy = this.polygon.routeProxy;
    const adapter = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.uni2Pools.poolWnativeUsdc;

    await testCommonRouteUniv2NativeToToken(signer, routeProxy, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonRouteUniv2TokenToNative() {
  it("route-univ2-token-native", async function () {
    /**
     * adapter: univ2
     * fromToken: usdc
     * toToken: native
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonRouteUniv2TokenToNative: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const routeProxy = this.polygon.routeProxy;
    const approve = this.polygon.approve;
    const adapter = this.polygon.uniV2Adapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.native;
    const poolAddr = config.uni2Pools.poolWnativeUsdc;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };

    await testCommonRouteUniv2TokenToNative(
      signer,
      routeProxy,
      approve,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
    );
  });
}

export function testPolygonRouteUniv2TokenToToken() {
  it("route-univ2-token-token", async function () {
    /**
     * adapter: univ2
     * fromToken: usdc
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonRouteUniv2TokenToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const routeProxy = this.polygon.routeProxy;
    const approve = this.polygon.approve;
    const adapter = this.polygon.uniV2Adapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.uni2Pools.poolUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };

    await testCommonRouteUniv2TokenToToken(
      signer,
      routeProxy,
      approve,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
    );
  });
}

export function testPolygonMeshswapRouteUniv2NativeToToken() {
  it("route-trashuniv2-native-token", async function () {
    /**
     * adapter: trashuniv2 (meshswap)
     * fromToken: native
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonMeshswapRouteUniv2NativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const routeProxy = this.polygon.routeProxy;
    const adapter = this.polygon.trashUniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.uni2Pools.poolMeshswapWnativeUsdt;
    const errorBound = BigNumber.from("0");
    const poolEdition = 2; // meshswap

    await testCommonRouteUniv2NativeToToken(
      signer,
      routeProxy,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      errorBound,
      poolEdition,
    );
  });
}

export function testPolygonMeshswapRouteUniv2TokenToNative() {
  it("route-trashuniv2-token-native", async function () {
    /**
     * adapter: trashuniv2 (meshswap)
     * fromToken: usdt
     * toToken: native
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonMeshswapRouteUniv2TokenToNative: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const routeProxy = this.polygon.routeProxy;
    const approve = this.polygon.approve;
    const adapter = this.polygon.trashUniV2Adapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdt;
    const toTokenAddr = config.tokens.native;
    const poolAddr = config.uni2Pools.poolMeshswapWnativeUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdt(signer, amountIn, adapterForDeposit);
    };
    const errorBound = BigNumber.from("0");
    const poolEdition = 2; // meshswap

    await testCommonRouteUniv2TokenToNative(
      signer,
      routeProxy,
      approve,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
      errorBound,
      poolEdition,
    );
  });
}

export function testPolygonMeshswapRouteUniv2TokenToToken() {
  it("route-trashuniv2-token-token", async function () {
    /**
     * adapter: trashuniv2 (meshswap)
     * fromToken: usdc
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonRouteUniv2TokenToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const routeProxy = this.polygon.routeProxy;
    const approve = this.polygon.approve;
    const adapter = this.polygon.trashUniV2Adapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.uni2Pools.poolMeshswapUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };
    const errorBound = BigNumber.from("0");
    const poolEdition = 2; // meshswap

    await testCommonRouteUniv2TokenToToken(
      signer,
      routeProxy,
      approve,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
      errorBound,
      poolEdition,
    );
  });
}
