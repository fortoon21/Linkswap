import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { bscConfig } from "../../config/bsc_config";
import { IERC20WithMint__factory, IERC20__factory, IWETH__factory } from "../../src/types";
import { logger } from "../logger";

/* ========================================================
 * new code
 * ======================================================== */
export function univ2WnativeToToken() {
  it("adapter-univ2-native-token", async function () {
    /**
     * adapter: univ2
     * fromToken: wnative
     * toToken: usdc
     */
    /* ---------------------------- hyperparam ---------------------------- */
    const amountIn = ethers.utils.parseEther("1");

    /* ---------------------------- args ---------------------------- */
    const adapter = this.uniV2Adapter;
    const signer = this.signers.admin;
    const toToken = IERC20__factory.connect(bscConfig.tokens.usdc, signer);
    const fromTokenAddr = bscConfig.tokens.wnative;
    const toTokenAddr = toToken.address;
    const poolAddr = bscConfig.uni2Pools.poolWnativeUsdc;
    const wnative = IWETH__factory.connect(bscConfig.tokens.wnative, signer);

    /* ---------------------------- run ---------------------------- */
    // path: signer -> wnative, token: native -> wnative
    await wnative.deposit({ value: amountIn }).then(tx => tx.wait());

    // path: wnative -> adapter, token: wnative
    await wnative.transfer(poolAddr, amountIn).then(tx => tx.wait());

    // estimate amountOut
    const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

    // path: adapter -> signer, token: native -> token
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
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

export function ellipsisNativeToToken() {
  it("adapter-ellipsis-native-token", async function () {
    /**
     * adapter: ellipsis
     * fromToken: native
     * toToken: bnbx
     */
    /* ---------------------------- hyperparam ---------------------------- */
    const amountIn = ethers.utils.parseEther("1");
    const errorBound = BigNumber.from("100000000"); // curve may ignore last 8 significant digit

    /* ---------------------------- args ---------------------------- */
    const adapter = this.ellipsisAdapter;
    const signer = this.signers.admin;
    const toToken = IERC20__factory.connect(bscConfig.tokens.bnbx, signer);
    const fromTokenAddr = bscConfig.tokens.native;
    const toTokenAddr = toToken.address;
    const poolAddr = bscConfig.curvePools.poolNativeBnbx;

    /* ---------------------------- assert ---------------------------- */
    if (!adapter) {
      logger.log("ellipsisNativeToToken: adapter not found");
      return;
    }

    /* ---------------------------- run ---------------------------- */
    // path: signer -> adapter, token: native
    await signer.sendTransaction({ to: adapter.address, value: amountIn, gasLimit: 1000000 });

    // estimate amountOut
    const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

    // path: adapter -> signer, token: native -> token
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());

    // mesaure amountOut from balance
    const amountOut = await toToken.balanceOf(signer.address);

    // calc abs(amountOut - amountOutEstimated)
    const amountOutError = amountOut.sub(amountOutEstimated).abs();

    // log
    logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError });

    // test
    expect(receipt.status).be.equal(1);
    expect(amountOutError).be.lessThanOrEqual(errorBound);
  });
}

export function ellipsisTokenToNative() {
  it("adapter-ellipsis-token-native", async function () {
    /**
     * adapter: ellipsis
     * fromToken: bnbx
     * toToken: native
     */
    /* ---------------------------- hyperparam ---------------------------- */
    const amountInForDeposit = ethers.utils.parseEther("1");
    const errorBound = BigNumber.from("100000000"); // curve may ignore last 8 significant digit

    /* ---------------------------- args ---------------------------- */
    const adapterForDeposit = this.ellipsisAdapter; // for depositUsdc
    const adapter = this.ellipsisAdapter;
    const signer = this.signers.admin;
    const fromToken = IERC20__factory.connect(bscConfig.tokens.bnbx, signer);
    const fromTokenAddr = fromToken.address;
    const toTokenAddr = bscConfig.tokens.native;
    const poolAddr = bscConfig.curvePools.poolNativeBnbx;

    /* ---------------------------- assert ---------------------------- */
    if (!adapter) {
      logger.log("ellipsisTokenToToken: adapter not found");
      return;
    }
    if (!adapterForDeposit) {
      logger.log("ellipsisTokenToToken: adapter not found");
      return;
    }
    /* ---------------------------- run ---------------------------- */
    // deposit token(bnbx)
    logger.log({ signer: { bnbx: { balance: await fromToken.balanceOf(signer.address) } } });
    await bscConfig.depositBnbx(signer, amountInForDeposit, adapterForDeposit);
    logger.log({ signer: { bnbx: { balance: await fromToken.balanceOf(signer.address) } } });
    const amountIn = await fromToken.balanceOf(signer.address);

    // path: signer -> adapter, token: token(bnbx)
    logger.log({ adapter: { bnbx: { balance: await fromToken.balanceOf(adapter.address) } } });
    await fromToken.transfer(adapter.address, amountIn).then(tx => tx.wait());
    logger.log({ adapter: { bnbx: { balance: await fromToken.balanceOf(adapter.address) } } });

    // estimate amountOut
    const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

    //
    const balanceBefore = await signer.getBalance();

    // path: adapter -> signer, token: token(bnbx) -> token(usdt)
    const swapOutput = await adapter.callStatic.swapExactIn(
      fromTokenAddr,
      amountIn,
      toTokenAddr,
      poolAddr,
      signer.address,
    );

    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());

    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    // measure amountOut from balance
    const amountOut = (await signer.getBalance()).sub(balanceBefore).add(gasUsed); // amountOut: after + gasUsed - before

    // calc abs(amountOut - amountOutEstimated)
    const amountOutError = amountOut.sub(amountOutEstimated).abs();

    // log
    logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, gasUsed, swapOutput });

    // test
    expect(receipt.status).be.equal(1);
    expect(amountOutError).be.lessThanOrEqual(errorBound);
  });
}

export function ellipsisTokenToToken() {
  it("adapter-ellipsis-token-token", async function () {
    /**
     * adapter: ellipsis
     * fromToken: usdc
     * toToken: usdt
     */
    /* ---------------------------- hyperparam ---------------------------- */
    const amountInForDeposit = ethers.utils.parseEther("1");
    const errorBound = BigNumber.from("100000000"); // curve may ignore last 8 significant digit

    /* ---------------------------- args ---------------------------- */
    const adapterForDeposit = this.uniV2Adapter; // for depositUsdc
    const adapter = this.ellipsisAdapter;
    const signer = this.signers.admin;
    const fromToken = IERC20__factory.connect(bscConfig.tokens.usdc, signer);
    const toToken = IERC20__factory.connect(bscConfig.tokens.usdt, signer);
    const fromTokenAddr = fromToken.address;
    const toTokenAddr = toToken.address;
    const poolAddr = bscConfig.curvePools.poolUsdcUsdt;

    /* ---------------------------- assert ---------------------------- */
    if (!adapter) {
      logger.log("ellipsisTokenToToken: adapter not found");
      return;
    }
    /* ---------------------------- run ---------------------------- */
    // deposit token(usdc)
    // logger.log({ signer: { usdc: { balance: await fromToken.balanceOf(signer.address) } } });
    await bscConfig.depositUsdc(signer, amountInForDeposit, adapterForDeposit);
    // logger.log({ signer: { usdc: { balance: await fromToken.balanceOf(signer.address) } } });
    const amountIn = await fromToken.balanceOf(signer.address);

    // path: signer -> adapter, token: token(usdc)
    // logger.log({ adapter: { usdc: { balance: await fromToken.balanceOf(adapter.address) } } });
    await fromToken.transfer(adapter.address, amountIn).then(tx => tx.wait());
    // logger.log({ adapter: { usdc: { balance: await fromToken.balanceOf(adapter.address) } } });

    // estimate amountOut
    const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

    // path: adapter -> signer, token: token(usdc) -> token(usdt)
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toTokenAddr, poolAddr, signer.address)
      .then(tx => tx.wait());

    // measure amountOut from balance
    const amountOut = await toToken.balanceOf(signer.address);

    // calc abs(amountOut - amountOutEstimated)
    const amountOutError = amountOut.sub(amountOutEstimated).abs();

    // log
    logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError });

    // test
    expect(receipt.status).be.equal(1);
    expect(amountOutError).be.lessThanOrEqual(errorBound);
  });
}

/* ========================================================
 * orig code
 * ======================================================== */
export function swapUniV2Adapter(): void {
  it("UniV2Swap", async function () {
    if (!this.config.Uni2Pool) {
      return;
    }

    const [poolAddr, tokenAddr] = this.config.Uni2Pool;

    const weth = IWETH__factory.connect(this.config.WETH, this.signers.admin);
    const token = IERC20__factory.connect(tokenAddr, this.signers.admin);

    const pool = await this.uniV2Viewer.getPoolInfo(poolAddr);

    const amountIn = ethers.utils.parseEther("1");

    await weth.deposit({ value: amountIn }).then(tx => tx.wait());
    await weth.transfer(pool.pool, amountIn).then(tx => tx.wait());

    const estimated = await this.uniV2Adapter.getAmountOut(weth.address, amountIn, token.address, pool.pool);

    const balanceBefore = await token.balanceOf(this.signers.admin.address);

    const receipt = await this.uniV2Adapter
      .swapExactIn(weth.address, amountIn, token.address, pool.pool, this.signers.admin.address)
      .then(tx => tx.wait());

    const balanceAfter = await token.balanceOf(this.signers.admin.address);

    expect(receipt.status).be.equal(1);
    expect(balanceAfter.sub(balanceBefore)).be.equal(estimated);
  });
}

export function swapEllipsisAdapter(): void {
  it("EllipsisSwap: NativeToToken", async function () {
    const adapter = this.ellipsisAdapter;
    const poolInfo = this.config.CurvePools.find(e => e.swapType === "NativeToToken");

    if (!adapter) {
      logger.log("no EllipsisAdapter");
      return;
    }
    if (!poolInfo) {
      logger.log("no Pool");
      return;
    }

    const poolAddr = poolInfo.address;

    if (!poolAddr) throw new Error("poolAddr not found");

    const fromTokenAddr = poolInfo.fromToken;
    const toTokenAddr = poolInfo.toToken;
    const toToken = IERC20__factory.connect(toTokenAddr, this.signers.admin);

    // hyperparam
    const errorBound = BigNumber.from("100000000"); // curve may ignore last 8 significant digit

    // Native is already deposited
    const NativeBefore = await this.signers.admin.getBalance();
    logger.log({ NativeBefore });

    // set amountIn
    const amountIn = ethers.utils.parseEther("1");

    // path: signer -> adapter, token: Native
    logger.log("path: signer -> adapter, token: Native");
    await this.signers.admin.sendTransaction({ to: adapter.address, value: amountIn, gasLimit: 1000000 });
    const bnbAfter = await this.signers.admin.getBalance();
    logger.log({ bnbAfter });

    // estimate amountOut
    logger.log("estimate amountOut");
    const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toToken.address, poolAddr);
    logger.log({ amountOutEstimated });

    // path: adapter -> signer, token: Native -> toToken
    logger.log("path: adapter -> signer, token: Native -> toToken");
    const receipt = await adapter
      .swapExactIn(fromTokenAddr, amountIn, toToken.address, poolAddr, this.signers.admin.address)
      .then(tx => tx.wait());

    // get amountOut
    logger.log("get amountOut");
    const amountOut = await toToken.balanceOf(this.signers.admin.address);
    const amountOutError = amountOut.sub(amountOutEstimated).abs();

    // result
    logger.log("result", {
      amountIn,
      amountOut,
      amountOutEstimated,
      amountOutError,
    });

    expect(receipt.status).be.equal(1);
    expect(amountOutError).be.lessThanOrEqual(errorBound); // same up to 1e-10 precision (8 significant digit may not be preserved)
  });
}

export function impersonateTest(): void {
  it("impersonateTest", async function () {
    logger.log("setup signer, owner");
    const signer = (await ethers.getSigners())[0];

    // logger.log({ getBalance: await owner.getBalance() });
    logger.log("connect contract: usdc");
    // usdc proxy: 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
    // usdc: https://bscscan.com/address/0xba5fe23f8a3a24bed3236f05f2fcf35fd0bf0b5c#readContract
    const usdc = IERC20WithMint__factory.connect("0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", signer);
    const ownerAddr = await usdc.getOwner();
    // const owner = await ethers.getImpersonatedSigner("0xf68a4b64162906eff0ff6ae34e2bb1cd42fef62d");
    const owner = await ethers.getImpersonatedSigner(ownerAddr);

    logger.log({ owner: { address: ownerAddr } });

    logger.log({ owner: { native: { balanceOf: await owner.getBalance() } } });

    logger.log("signer.sendTransaction");
    await signer
      .sendTransaction({ to: owner.address, value: ethers.utils.parseEther("1"), gasLimit: 3e7 })
      .then(tx => tx.wait());

    logger.log({ owner: { native: { balanceOf: await owner.getBalance() } } });

    // await usdc.mint(ethers.utils.parseEther("1"));
    // logger.log("usdc.transfer");
    // await usdc.connect(owner).transfer(signer.address, ethers.utils.parseEther("1"));

    logger.log({ owner: { usdc: { balanceOf: await usdc.balanceOf(owner.address) } } });

    logger.log("usdc.mint");
    await usdc
      .connect(owner)
      .mint(ethers.utils.parseEther("1"), { gasLimit: 3e7 })
      .then(tx => tx.wait());

    logger.log({ owner: { usdc: { balanceOf: await usdc.balanceOf(owner.address) } } });

    logger.log("transfer");
    await usdc
      .connect(owner)
      .transfer(signer.address, ethers.utils.parseEther("1"), { gasLimit: 3e7 })
      .then(tx => tx.wait());

    logger.log({ signer: { usdc: { balanceOf: await usdc.balanceOf(signer.address) } } });
  });
}
