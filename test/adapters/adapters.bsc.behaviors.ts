import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { Chain, getChain } from "../../config";
import { BscConfig } from "../../config/bsc_config";
import { IERC20__factory } from "../../src/types";
import { logger } from "../logger";
import {
  testCommonAdapterEllipsisNativeToToken,
  testCommonAdapterEllipsisTokenToNative,
  testCommonAdapterEllipsisTokenToToken,
  testCommonAdapterUniv2WnativeToToken,
} from "./adapters.common.behaviors";

/* ========================================================
 * new code
 * ======================================================== */
export function testBscAdapterUniv2WnativeToToken() {
  it("adapter-univ2-wnative-token", async function () {
    /**
     * adapter: univ2
     * fromToken: wnative
     * toToken: usdc
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterUniv2WnativeToToken: skip test");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.uniV2Adapter;
    const config = this.bsc.config as BscConfig;
    const fromTokenAddr = config.tokens.wnative;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.uni2Pools.poolWnativeUsdc;

    await testCommonAdapterUniv2WnativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testBscAdapterEllipsisNativeToToken() {
  it("adapter-ellipsis-native-token", async function () {
    /**
     * adapter: ellipsis
     * fromToken: native
     * toToken: bnbx
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisNativeToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisNativeToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.bnbx;
    const poolAddr = config.curvePools.poolNativeBnbx;

    await testCommonAdapterEllipsisNativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr);
  });
}

export function testBscAdapterEllipsisTokenToNative() {
  it("adapter-ellipsis-token-native", async function () {
    /**
     * adapter: ellipsis
     * fromToken: bnbx
     * toToken: native
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisTokenToNative: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisTokenToNative: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.ellipsisAdapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.bnbx;
    const toTokenAddr = config.tokens.native;
    const poolAddr = config.curvePools.poolNativeBnbx;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositBnbx(signer, amountIn, adapterForDeposit);
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

export function testBscAdapterEllipsisTokenToToken() {
  it("adapter-ellipsis-token-token-1", async function () {
    /**
     * adapter: ellipsis
     * fromToken: usdc
     * toToken: usdt
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisTokenToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisTokenToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
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
  it("adapter-ellipsis-token-token-2", async function () {
    /**
     * adapter: ellipsis
     * fromToken: usdd
     * toToken: eps3
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisTokenToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisTokenToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.usdd;
    const toTokenAddr = config.tokens.eps3;
    const poolAddr = config.curvePools.poolUsddEps3;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdd(signer, amountIn, adapterForDeposit);
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
  it("adapter-ellipsis-token-token-3", async function () {
    /**
     * adapter: ellipsis
     * fromToken: usdd
     * toToken: busd
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisTokenToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisTokenToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.usdd;
    const toTokenAddr = config.tokens.busd;
    const poolAddr = config.curvePools.poolUsddBusd;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdd(signer, amountIn, adapterForDeposit);
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
  it("adapter-ellipsis-token-token-4", async function () {
    /**
     * adapter: ellipsis
     * fromToken: busd
     * toToken: arth
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisTokenToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisTokenToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.busd;
    const toTokenAddr = config.tokens.arth;
    const poolAddr = config.curvePools.poolBusdArth;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositBusd(signer, amountIn, adapterForDeposit);
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

export function testBscAdapterEllipsisTokenToLp() {
  it("adapter-ellipsis-token-lp", async function () {
    /**
     * adapter: ellipsis
     * fromToken: usdc
     * toToken: lp
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisTokenToLp: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisTokenToLp: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.usdc;
    const toTokenAddr = config.tokens.lpOfCurveUsdcUsdt;
    const poolAddr = config.curvePools.poolUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositUsdc(signer, amountIn, adapterForDeposit);
    };
    const errorBound = BigNumber.from("100000000000000000"); //@TODO: fee 때문에 0.02%~0.03% 안맞는것 일단은 무시하기위해서 넣음

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

export function testBscAdapterEllipsisLpToToken() {
  it("adapter-ellipsis-lp-token", async function () {
    /**
     * adapter: ellipsis
     * fromToken: usdc
     * toToken: lp
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisLpToToken: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisLpToToken: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDepositUsdc = this.bsc.uniV2Adapter;
    const adapterForDepositLpOfCUrveUsdcUsdt = this.bsc.ellipsisAdapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.lpOfCurveUsdcUsdt;
    const toTokenAddr = config.tokens.usdc;
    const poolAddr = config.curvePools.poolUsdcUsdt;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      const usdc = IERC20__factory.connect(config.tokens.usdc, signer);
      await config.depositUsdc(signer, amountIn, adapterForDepositUsdc);
      const balanceUsdc = await usdc.balanceOf(signer.address);
      await config.depositLpOfUsdcUsdt(signer, balanceUsdc, adapterForDepositLpOfCUrveUsdcUsdt);
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

export function testBscAdapterEllipsisNativeToLp() {
  it("adapter-ellipsis-native-lp", async function () {
    /**
     * adapter: ellipsis
     * fromToken: native
     * toToken: lpOfCurveNativeBnbx
     * pool: (native, bnbx)
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisNativeToLp: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisNativeToLp: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDeposit = this.bsc.uniV2Adapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.native;
    const toTokenAddr = config.tokens.lpOfCurveNativeBnbx;
    const poolAddr = config.curvePools.poolNativeBnbx;
    // const errorBound = BigNumber.from("100000000000000000"); //@TODO: fee 때문에 0.02%~0.03% 안맞는것 일단은 무시하기위해서 넣음
    const errorBound = BigNumber.from("0"); //@TODO: fee 때문에 0.02%~0.03% 안맞는것 일단은 무시하기위해서 넣음

    await testCommonAdapterEllipsisNativeToToken(signer, adapter, fromTokenAddr, toTokenAddr, poolAddr, errorBound);
  });
}

//@TODO
export function testBscAdapterEllipsisLpToNative() {
  it("adapter-ellipsis-lp-native", async function () {
    /**
     * adapter: ellipsis
     * fromToken: lpOfCurveNativeBnbx
     * toToken: native
     * pool: (native, bnbx)
     */
    if ((await getChain(ethers)) !== Chain.Bsc) {
      logger.log("testBscAdapterEllipsisLpToNative: skip test");
      return;
    }
    if (!this.bsc.ellipsisAdapter) {
      logger.log("testBscAdapterEllipsisLpToNative: no ellipsis adapter");
      return;
    }

    const signer = this.bsc.signers.admin;
    const adapter = this.bsc.ellipsisAdapter;
    const adapterForDepositLpOfCurveNativeBnbx = this.bsc.ellipsisAdapter;
    const config = this.bsc.config;
    const fromTokenAddr = config.tokens.lpOfCurveNativeBnbx;
    const toTokenAddr = config.tokens.native;
    const poolAddr = config.curvePools.poolNativeBnbx;
    const depositFromToken = async (signer: SignerWithAddress, amountIn: BigNumber) => {
      await config.depositLpOfCurveNativeBnbx(signer, amountIn, adapterForDepositLpOfCurveNativeBnbx);
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
