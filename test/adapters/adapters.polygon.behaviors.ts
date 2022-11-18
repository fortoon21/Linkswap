import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { PolygonConfig } from "../../config/matic_config";
import { IERC20__factory, IWETH__factory } from "../../src/types";
import { logger } from "../logger";
import { calcGasFee } from "../routes/routes.common.behaviors";
import { TokenBalanceChangeDetector } from "../utils";
import {
  testCommonAdapterBalancerNativeToToken,
  testCommonAdapterBalancerTokenToNative,
  testCommonAdapterBalancerTokenToToken,
  testCommonAdapterEllipsisNativeToToken,
  testCommonAdapterEllipsisTokenToNative,
  testCommonAdapterEllipsisTokenToToken,
  testCommonAdapterTrashUniv2WnativeToToken,
  testCommonAdapterUniv2WnativeToToken,
  testCommonAdapterUniv3WnativeToToken,
} from "./adapters.common.behaviors";

/* ========================================================
 * new code
 * ======================================================== */

export function testPolygonAdapterUniv3WnativeToToken() {
  it("adapter-univ3-wnative-token", async function () {
    /**
     * adapter: univ3
     * fromToken: wnative
     * toToken: usdc
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterUniv3WnativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.uniV3Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.wnative;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.uni3Pools.poolWnativeUsdc;

    await testCommonAdapterUniv3WnativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterUniv2WnativeToToken() {
  it("adapter-univ2-wnative-token", async function () {
    /**
     * adapter: univ2
     * fromToken: wnative
     * toToken: usdc
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterUniv2WnativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.wnative;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.uni2Pools.poolWnativeUsdc;

    await testCommonAdapterUniv2WnativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterTrashUniv2WnativeToToken() {
  it("adapter-trashuniv2-wnative-token", async function () {
    /**
     * adapter: trashUniv2 (meshswap)
     * fromToken: wnative
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterTrashUniv2WnativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.trashUniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.wnative;
    const toTokenAddr = "0x1bD5048e0B85c410dd039aa9c05069A9d82488b8"; // config.tokens.usdt;
    const poolAddr = "0x8A43AB8B53e032ec1A202ceaBbCcD804270b9025"; // config.uni2Pools.poolMeshswapWnativeUsdt;

    await testCommonAdapterTrashUniv2WnativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterMeshswapUniv2WnativeToToken() {
  it("adapter-meshswapuniv2-wnative-token", async function () {
    /**
     * adapter: univ2 (meshswap)
     * fromToken: wnative
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterMeshswapUniv2WnativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.wnative;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.uni2Pools.poolMeshswapWnativeUsdt;
    // const toTokenAddr = "0x1bD5048e0B85c410dd039aa9c05069A9d82488b8"; // config.tokens.usdt;
    // const poolAddr = "0x8A43AB8B53e032ec1A202ceaBbCcD804270b9025"; // config.uni2Pools.poolMeshswapWnativeUsdt;

    await testCommonAdapterUniv2WnativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterQuickswapUniv2WnativeToToken() {
  it("adapter-quickswapuniv2-wnative-token", async function () {
    /**
     * adapter: univ2 (quickswap)
     * fromToken: wnative
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterQuickswapUniv2WnativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.wnative;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.uni2Pools.poolQuickswapWnativeUsdt;

    await testCommonAdapterUniv2WnativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterMMUniv2WnativeToToken() {
  it("adapter-mmuniv2-wnative-token", async function () {
    /**
     * adapter: univ2 (MM)
     * fromToken: wnative
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterMMUniv2WnativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.wnative;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.uni2Pools.poolMMWnativeUsdt;

    await testCommonAdapterUniv2WnativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterCurveNativeToToken() {
  it("adapter-curve-native-token", async function () {
    /**
     * adapter: curve
     * fromToken: native
     * toToken: bnbx
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterCurveNativeToToken: skip test");
      return;
    }
    if (!this.polygon.curveAdapter) {
      logger.log("testPolygonAdapterCurveNativeToToken: no curve adapter");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.curveAdapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.stmatic;
    const poolAddr = config.curvePools.poolNativeStmatic;

    await testCommonAdapterEllipsisNativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterCurveTokenToNative() {
  it("adapter-curve-token-native", async function () {
    /**
     * adapter: curve
     * fromToken: bnbx
     * toToken: native
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterCurveTokenToNative: skip test");
      return;
    }
    if (!this.polygon.curveAdapter) {
      logger.log("testPolygonAdapterCurveTokenToNative: no curve adapter");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.curveAdapter;
    const adapterForDeposit = this.polygon.curveAdapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.stmatic;
    const toTokenAddr = config.tokens.native;
    const poolAddr = config.curvePools.poolNativeStmatic;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositStmatic(signer, amountIn, adapterForDeposit);
    };

    await testCommonAdapterEllipsisTokenToNative(
      signer,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
    );
  });
}

export function testPolygonAdapterCurveTokenToToken() {
  it("adapter-curve-token-token", async function () {
    /**
     * adapter: curve
     * fromToken: usdc
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterCurveTokenToToken: skip test");
      return;
    }
    if (!this.polygon.curveAdapter) {
      logger.log("testPolygonAdapterCurveTokenToToken: no curve adapter");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.curveAdapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.usdt;
    const poolAddr = config.curvePools.poolUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };

    await testCommonAdapterEllipsisTokenToToken(
      signer,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
    );
  });
}

export function testPolygonAdapterCurveTokenToLp() {
  it("adapter-curve-token-lp", async function () {
    /**
     * adapter: curve
     * fromToken: usdc
     * toToken: lp
     * pool: (usdc, usdt)
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterCurveTokenToLp: skip test");
      return;
    }
    if (!this.polygon.curveAdapter) {
      logger.log("testPolygonAdapterCurveTokenToLp: no curve adapter");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.curveAdapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.lpOfCurveUsdcUsdt;
    const poolAddr = config.curvePools.poolUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };
    const errorBound = BigNumber.from("10000000000000000"); //@TODO: fee 때문에 0.02%~0.03% 안맞는것 일단은 무시하기위해서 넣음 // amountIn에 0.03%에 비례하도록 추가적인 코딩 필요

    await testCommonAdapterEllipsisTokenToToken(
      signer,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
      errorBound,
    );
  });
}

export function testPolygonAdapterCurveLpToToken() {
  it("adapter-curve-lp-token", async function () {
    /**
     * adapter: curve
     * fromToken: lp
     * toToken: usdc
     * pool: (usdc, usdt)
     */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterCurveLpToToken: skip test");
      return;
    }
    if (!this.polygon.curveAdapter) {
      logger.log("testPolygonAdapterCurveLpToToken: no curve adapter");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.curveAdapter;
    const adapterForDepositUsdc = this.polygon.uniV2Adapter;
    const adapterForDepositLpOfCurveUsdcUsdt = this.polygon.curveAdapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.lpOfCurveUsdcUsdt;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.curvePools.poolUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      const usdc = IERC20__factory.connect(config.tokens.usdc, signer);
      await config.depositUsdc(signer, amountIn, adapterForDepositUsdc);
      const balanceUsdc = await usdc.balanceOf(signer.address);
      await config.depositLpOfCurveUsdcUsdt(signer, balanceUsdc, adapterForDepositLpOfCurveUsdcUsdt);
    };
    const errorBound = BigNumber.from("300000000000000"); //@TODO: fee 때문에 0.02%~0.03% 안맞는것 일단은 무시하기위해서 넣음

    await testCommonAdapterEllipsisTokenToToken(
      signer,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
      errorBound,
    );
  });
}

export function testPolygonAdapterBalancerNativeToToken() {
  it("adapter-balancer-native-token", async function () {
    /* ========================================================
     * adapter: balancer
     * fromToken: native
     * toToken: usdc
     * pool: (wnatvie, usdc)
     * ======================================================== */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterBalancerNativeToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.balancerAdapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.balancerPools.poolWnativeUsdc;

    await testCommonAdapterBalancerNativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testPolygonAdapterBalancerTokenToNative() {
  it("adapter-balancer-token-native", async function () {
    /* ========================================================
     * adapter: balancer
     * fromToken: usdc
     * toToken: native
     * pool: (wnatvie, usdc)
     * ======================================================== */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterBalancerTokenToNative: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.balancerAdapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.native;
    const poolAddr = config.balancerPools.poolWnativeUsdc;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };

    await testCommonAdapterBalancerTokenToNative(
      signer,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
    );
  });
}

export function testPolygonAdapterBalancerTokenToToken() {
  it("adapter-balancer-token-token", async function () {
    /* ========================================================
     * adapter: balancer
     * fromToken: usdc
     * toToken: usdt
     * pool: (usdc, usdt)
     * ======================================================== */
    if ((await getChain(ethers)) !== Chain.Polygon) {
      logger.log("testPolygonAdapterBalancerTokenToToken: skip test");
      return;
    }

    const signer = this.polygon.signers.admin;
    const adapter = this.polygon.balancerAdapter;
    const adapterForDeposit = this.polygon.uniV2Adapter;
    const config = this.polygon.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.weth;
    const poolAddr = config.balancerPools.poolUsdcWeth;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };

    await testCommonAdapterBalancerTokenToToken(
      signer,
      adapter,
      fromTokenAddr,
      toTokenAddr,
      poolAddr,
      depositFromToken,
    );
  });
}
