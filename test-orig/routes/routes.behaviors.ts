import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { bscConfig } from "../../config/bsc_config";
import { IERC20WithMint__factory, IERC20__factory, IWETH__factory } from "../../src/types";
import { logger } from "../logger";

/* ========================================================
 * new code
 * ======================================================== */
export function univ2NativeToToken() {
  it("route-univ2-native-token", async function () {
    /**
     * adapter: univ2
     * fromToken: native
     * toToken: usdc
     */
    /* ---------------------------- hyperparam ---------------------------- */
    const amountIn = ethers.utils.parseEther("1");

    /* ---------------------------- args ---------------------------- */
    const adapter = this.uniV2Adapter;
    const routeProxy = this.routeProxy;
    const signer = this.signers.admin;
    const toToken = IERC20__factory.connect(bscConfig.tokens.usdc, signer);
    const fromTokenAddr = bscConfig.tokens.native;
    const toTokenAddr = toToken.address;
    const poolAddr = bscConfig.uni2Pools.poolWnativeUsdc;

    /* ---------------------------- setup ---------------------------- */
    const pathInfos = [
      {
        fromToken: fromTokenAddr,
        amountIn,
        toToken: toTokenAddr,
        to: signer.address,
        pool: poolAddr,
        adapter: adapter.address,
        poolEdition: 0,
      },
    ];

    /* ---------------------------- run ---------------------------- */
    // path: signer -> adapter, token: native
    await signer.sendTransaction({ value: amountIn, to: routeProxy.address, gasLimit: 3e7 }).then(tx => tx.wait());

    // estimate amountOut
    const [_, amountOutEstimated] = await routeProxy.callStatic.getMultiHopSingleSwapOut(
      fromTokenAddr,
      amountIn,
      toTokenAddr,
      pathInfos,
    );
    await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

    // path: adapter -> signer, token: native -> token
    const receipt = await routeProxy
      .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0], { value: amountIn })
      .then(tx => tx.wait());

    // mesaure amountOut from balance
    const amountOut = await toToken.balanceOf(signer.address);

    // calc abs(amountOut - amountOutEstimated)
    const amountOutError = amountOut.sub(amountOutEstimated).abs();

    // log
    logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError });

    // test
    expect(receipt.status).be.equal(1);
    expect(amountOutError).be.lessThanOrEqual(0);
  });
}
