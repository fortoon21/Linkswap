import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import * as _ from "lodash";
import { map } from "lodash";
import * as util from "util";

import { Chain, getChain } from "../../config";
import { BscConfig } from "../../config/bsc_config";
import { MultiAMMLib } from "../../src/types/SmartRoute/proxies/RouteProxy";
import { logger } from "../logger";
import {
  testCommonRouteEllipsisNativeToToken,
  testCommonRouteEllipsisTokenToNative,
  testCommonRouteEllipsisTokenToToken,
  testCommonRouteShieldSwapNativeToToken,
  testCommonRouteUniv2NativeToToken,
  testCommonRouteUniv2TokenToNative,
  testCommonRouteUniv2TokenToToken,
} from "./routes.common.behaviors";

export function testBscRouteShieldSwapNativeToToken() {
  it("route-shield-native-wnative", async function () {
    /**
     * fromToken: native
     * toToken: wnative
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscRouteShieldSwapNativeToToken: skip test");
      return;
    }

    const signer = this.bsc.signers.admin;
    const routeProxy = this.bsc.routeProxy;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.busd;
    const amountIn = ethers.utils.parseEther("1");
    const uniV2Adapter = this.bsc.uniV2Adapter;

    const response = await axios.post(`${process.env.API_SERVER_ENDPOINT}/v1/quote/calculate`, {
      options: {
        tokenInAddr: fromTokenAddr,
        tokenOutAddr: toTokenAddr,
        from: signer.address,
        amount: amountIn.toString(),
        slippageBps: 100,
        maxEdge: 4,
        maxSplit: 5,
        withCycle: false,
      },
    });
    const amountOutEstimatedFromServer = BigNumber.from(response.data.dexAgg.expectedAmountOut);
    const txBytes = response.data.metamaskSwapTransaction.data as string;
    const data = response.data;
    const args = this.bsc.routeProxy.interface.decodeFunctionData("shieldSwap", txBytes);

    // logger.log(JSON.stringify(args, null, 2));
    logger.log(util.inspect({ args }, false, null, true));
    // logger.log(JSON.stringify({ data: _.pick(data, ["dexAgg", "cycles", "singleDexes"]) }, null, 2));

    const adapterMap = new Map<string, string>();
    adapterMap.set("0x1CC390780132Fad16519661dA3FE53E8d9a008E6", uniV2Adapter.address);
    logger.log({
      deploy: { uniV2Adapter: "0x1CC390780132Fad16519661dA3FE53E8d9a008E6" },
      hardhat: { uniV2Adapter: uniV2Adapter.address },
    });

    const parsedArgs = {
      fromToken: args.fromToken,
      amountIn: args.amountIn,
      toToken: args.toToken,
      linearWeightPathInfo: {
        fromToken: args.linearWeightPathInfo.fromToken,
        amountIn: args.linearWeightPathInfo.amountIn,
        toToken: args.linearWeightPathInfo.toToken,
        to: args.linearWeightPathInfo.to,
        weights: args.linearWeightPathInfo.weights,
        weightedSwaps: args.linearWeightPathInfo.weightedSwaps.map((e: any) =>
          e.map((f: any) => ({
            fromToken: f.fromToken,
            amountIn: f.amountIn,
            toToken: f.toToken,
            to: f.to,
            pools: f.pools,
            weights: f.weights,
            // adapters: f.adapters,
            adapters: f.adapters.map((g: any) => adapterMap.get(g)),
            poolEditions: f.poolEditions,
          })),
        ),
      },
    };
    // logger.log(JSON.stringify(parsedArgs, null, 2));
    logger.log(util.inspect({ parsedArgs }, false, null, true));

    await testCommonRouteShieldSwapNativeToToken(
      signer,
      routeProxy,
      // args.linearWeightPathInfo,
      parsedArgs.linearWeightPathInfo,
      fromTokenAddr,
      amountIn,
      toTokenAddr,
      amountOutEstimatedFromServer,
    );
  });
}

export function testBscRouteUniv2NativeToToken() {
  it("route-univ2-native-token", async function () {
    /**
     * adapter: univ2
     * fromToken: native
     * toToken: usdc
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscRouteUniv2NativeToToken: skip test");
      return;
    }

    const signer = this.bsc.signers.admin;
    const routeProxy = this.bsc.routeProxy;
    const adapter = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.uni2Pools.poolWnativeUsdc;

    await testCommonRouteUniv2NativeToToken(signer, routeProxy, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testBscRouteUniv2TokenToNative() {
  it("route-univ2-token-native", async function () {
    /**
     * adapter: univ2
     * fromToken: usdc
     * toToken: native
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscRouteUniv2TokenToNative: skip test");
      return;
    }

    const signer = this.bsc.signers.admin;
    const routeProxy = this.bsc.routeProxy;
    const approve = this.bsc.approve;
    const adapter = this.bsc.uniV2Adapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
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

export function testBscRouteUniv2TokenToToken() {
  it("route-univ2-token-token", async function () {
    /**
     * adapter: univ2
     * fromToken: usdc
     * toToken: uset
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscRouteUniv2TokenToToken: skip test");
      return;
    }

    const signer = this.bsc.signers.admin;
    const routeProxy = this.bsc.routeProxy;
    const approve = this.bsc.approve;
    const adapter = this.bsc.uniV2Adapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
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

export function testBscRouteEllipsisNativeToToken() {
  it("route-ellipsis-native-token", async function () {
    /**
     * adapter: ellipsis
     * fromToken: native
     * toToken: bnbx
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscRouteEllipsisNativeToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscRouteEllipsisNativeToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const routeProxy = this.bsc.routeProxy;
    // const approve = this.bsc.approve;
    const adapter = this.bsc.ellipsisAdapter;
    // const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.bnbx;
    const poolAddr = config.curvePools.poolNativeBnbx;
    // const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
    //   await config.depositUsdc(signer, amountIn, adapterForDeposit);
    // };

    await testCommonRouteEllipsisNativeToToken(signer, routeProxy, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testBscRouteEllipsisTokenToNative() {
  it("route-ellipsis-token-native", async function () {
    /**
     * adapter: ellipsis
     * fromToken: bnbx
     * toToken: token
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscRouteEllipsisTokenToNative: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscRouteEllipsisTokenToNative: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const routeProxy = this.bsc.routeProxy;
    const approve = this.bsc.approve;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.ellipsisAdapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.bnbx;
    const toTokenAddr = config.tokens.native;
    const poolAddr = config.curvePools.poolNativeBnbx;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositBnbx(signer, amountIn, adapterForDeposit);
    };

    await testCommonRouteEllipsisTokenToNative(
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

export function testBscRouteEllipsisTokenToToken() {
  it("route-ellipsis-token-token", async function () {
    /**
     * adapter: ellipsis
     * fromToken: token(usdc)
     * toToken: token(usdt)
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscRouteEllipsisTokenToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscRouteEllipsisTokenToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const routeProxy = this.bsc.routeProxy;
    const approve = this.bsc.approve;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.curvePools.poolUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };

    await testCommonRouteEllipsisTokenToToken(
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
