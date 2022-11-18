import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { bscConfig } from "../../config/bsc_config";
import { IConfig } from "../../config/common_config";
import {
  BalancerAdapter,
  CurveAdapter,
  EllipsisAdapter,
  IERC20__factory,
  IWETH__factory,
  UniV2Adapter,
  UniV3Adapter,
} from "../../src/types";
import { logger } from "../logger";
import { calcGasFee } from "../routes/routes.common.behaviors";
import { NativeBalanceChangeDetector, TokenBalanceChangeDetector } from "../utils";

/* ========================================================
 * adapter: univ2
 * fromToken: wnative
 * toToken: usdc
 * ======================================================== */
export const testCommonAdapterUniv2WnativeToToken = async (
  signer: SignerWithAddress,
  adapter: UniV2Adapter, // adapter which will be tested
  fromTokenAddr: string, // wnative
  toTokenAddr: string, // usdc
  poolAddr: string, // (wnative, usdc)
  errorBound: BigNumber = BigNumber.from("0"),
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const wnative = IWETH__factory.connect(fromTokenAddr, signer);
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // path: signer -> wnative, token: native -> wnative
  logger.log("path: signer -> wnative, token: native -> wnative");
  await wnative.deposit({ value: amountIn }).then(tx => tx.wait());

  // path: wnative -> adapter, token: wnative
  logger.log("path: wnative -> adapter, token: wnative");
  await wnative.transfer(poolAddr, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

  // path: adapter -> signer, token: wnative -> toToken
  logger.log("path: adapter -> signer, token: wnative -> toToken");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, swapOutput, gasFee });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: univ3
 * fromToken: wnative
 * toToken: usdc
 * ======================================================== */
export const testCommonAdapterUniv3WnativeToToken = async (
  signer: SignerWithAddress,
  adapter: UniV3Adapter, // adapter which will be tested
  fromTokenAddr: string, // wnative
  toTokenAddr: string, // usdc
  poolAddr: string, // (wnative, usdc)
  errorBound: BigNumber = BigNumber.from("0"),
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const wnative = IWETH__factory.connect(fromTokenAddr, signer);
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // path: signer -> wnative, token: native -> wnative
  logger.log("path: signer -> wnative, token: native -> wnative");
  await wnative.deposit({ value: amountIn }).then(tx => tx.wait());

  // path: wnative -> adapter, token: wnative
  logger.log("path: wnative -> adapter, token: wnative");
  await wnative.transfer(adapter.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.callStatic.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

  // path: adapter -> signer, token: wnative -> toToken
  logger.log("path: adapter -> signer, token: wnative -> toToken");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, swapOutput, gasFee });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: univ2 (trash)
 * fromToken: wnative
 * toToken: usdc
 * ======================================================== */
export const testCommonAdapterTrashUniv2WnativeToToken = async (
  signer: SignerWithAddress,
  adapter: UniV2Adapter, // adapter which will be tested
  fromTokenAddr: string, // wnative
  toTokenAddr: string, // usdc
  poolAddr: string, // (wnative, usdc)
  errorBound: BigNumber = BigNumber.from("0"),
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const wnative = IWETH__factory.connect(fromTokenAddr, signer);
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // path: signer -> wnative, token: native -> wnative
  logger.log("path: signer -> wnative, token: native -> wnative");
  await wnative.deposit({ value: amountIn }).then(tx => tx.wait());

  // path: wnative -> adapter, token: wnative
  logger.log("path: wnative -> adapter, token: wnative");
  await wnative.transfer(adapter.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

  // path: adapter -> signer, token: wnative -> toToken
  logger.log("path: adapter -> signer, token: wnative -> toToken");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, swapOutput, gasFee });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: ellipsis
 * fromToken: native
 * toToken: bnbx
 * ======================================================== */
export const testCommonAdapterEllipsisNativeToToken = async (
  signer: SignerWithAddress,
  adapter: EllipsisAdapter | CurveAdapter, // adapter which will be tested
  fromTokenAddr: string, // native
  toTokenAddr: string, // bnbx
  poolAddr: string, // (native, bnbx)
  errorBound: BigNumber = BigNumber.from("100000000"), // curve may ignore last 8 significant digit
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("adapterCommonTestEllipsisNativeToToken: adapter not found");
    return;
  }

  /* ---------------------------- run ---------------------------- */
  // path: signer -> adapter, token: native
  logger.log("path: signer -> adapter, token: native");
  await signer.sendTransaction({ to: adapter.address, value: amountIn, gasLimit: 1000000 });

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

  // path: adapter -> signer, token: native -> toToken
  logger.log("path: adapter -> signer, token: native -> toToken");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, swapOutput, gasFee });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: ellipsis
 * fromToken: bnbx
 * toToken: native
 * ======================================================== */
export const testCommonAdapterEllipsisTokenToNative = async (
  signer: SignerWithAddress,
  adapter: EllipsisAdapter, // adapter which will be tested
  fromTokenAddr: string, // bnbx
  toTokenAddr: string, // native
  poolAddr: string, // (native, bnbx)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>,
  errorBound: BigNumber = BigNumber.from("100000000"), // curve may ignore last 8 significant digit
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new NativeBalanceChangeDetector(signer);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("testCommonAdapterEllipsisTokenToNative: adapter not found");
    return;
  }
  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  await depositFromToken(signer, amountInForDeposit);
  const amountIn = await fromToken.balanceOf(signer.address);

  // path: signer -> adapter, token: fromToken
  logger.log("path: signer -> adapter, token: fromToken");
  await fromToken.transfer(adapter.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

  // path: adapter -> signer, token: fromToken -> native
  logger.log("path: adapter -> signer, token: fromToken -> native");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = gasFee.add(await bcd.after());

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, swapOutput, gasFee });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: ellipsis
 * fromToken: usdc
 * toToken: usdt
 * ======================================================== */
export const testCommonAdapterEllipsisTokenToToken = async (
  signer: SignerWithAddress,
  adapter: EllipsisAdapter, // adapter which will be tested
  fromTokenAddr: string, // usdc
  toTokenAddr: string, // usdt
  poolAddr: string, // (usdc, usdt)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>,
  errorBound: BigNumber = BigNumber.from("100000000"), // curve may ignore last 8 significant digit
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("testCommonAdapterEllipsisTokenToToken: adapter not found");
    return;
  }
  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  await depositFromToken(signer, amountInForDeposit);
  const amountIn = await fromToken.balanceOf(signer.address);

  // path: signer -> adapter, token: fromToken
  logger.log("path: signer -> adapter, token: fromToken");
  await fromToken.transfer(adapter.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);

  // path: adapter -> signer, token: fromToken -> toToken
  logger.log("path: adapter -> signer, token: fromToken -> toToken");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, swapOutput, gasFee });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: balancer
 * fromToken: native
 * toToken: usdc
 * pool: (wnatvie, usdc)
 * ======================================================== */
export const testCommonAdapterBalancerNativeToToken = async (
  signer: SignerWithAddress,
  adapter: BalancerAdapter, // adapter which will be tested
  fromTokenAddr: string, // native
  toTokenAddr: string, // usdc
  poolAddr: string, // (wnative, usdc)
  errorBound: BigNumber = BigNumber.from("0"),
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("testCommonAdapterBalancerNativeToToken: adapter not found");
    return;
  }

  /* ---------------------------- run ---------------------------- */
  // path: signer -> adapter, token: native
  logger.log("path: signer -> adapter, token: native");
  await signer.sendTransaction({ to: adapter.address, value: amountIn, gasLimit: 1000000 });

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.callStatic.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);
  const receiptGetAmountOut = await adapter
    .getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr)
    .then(tx => tx.wait());
  // const amountOutEstimated = await adapter.callStatic.getAmountOut(
  //   "0x0000000000000000000000000000000000000000",
  //   amountIn,
  //   toTokenAddr,
  //   poolAddr,
  // );
  // const receiptGetAmountOut = await adapter
  //   .getAmountOut("0x0000000000000000000000000000000000000000", amountIn, toTokenAddr, poolAddr)
  //   .then(tx => tx.wait());

  const gasFeeGetAmountOut = calcGasFee(receiptGetAmountOut);

  // path: adapter -> signer, token: native -> toToken
  logger.log("path: adapter -> signer, token: native -> toToken");
  await bcd.before();
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
  // const swapOutput = await adapter.callStatic.swapExactIn(
  //   "0x0000000000000000000000000000000000000000",
  //   amountIn,
  //   toTokenAddr,
  //   poolAddr,
  //   signer.address,
  // );
  // const receipt = await adapter
  //   .swapExactIn("0x0000000000000000000000000000000000000000", amountIn, toTokenAddr, poolAddr, signer.address)
  //   .then(tx => tx.wait());
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", {
    amountIn,
    amountOut,
    amountOutEstimated,
    amountOutError,
    swapOutput,
    gasFee,
    gasFeeGetAmountOut,
  });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: balancer
 * fromToken: usdc
 * toToken: native
 * pool: (wnatvie, usdc)
 * ======================================================== */
export const testCommonAdapterBalancerTokenToNative = async (
  signer: SignerWithAddress,
  adapter: BalancerAdapter, // adapter which will be tested
  fromTokenAddr: string, // usdc
  toTokenAddr: string, // native
  poolAddr: string, // (wnative, usdc)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>,
  errorBound: BigNumber = BigNumber.from("0"),
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new NativeBalanceChangeDetector(signer);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("testCommonAdapterBalancerTokenToNative: adapter not found");
    return;
  }

  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  await depositFromToken(signer, amountInForDeposit);
  const amountIn = await fromToken.balanceOf(signer.address);

  // path: signer -> adapter, token: fromToken
  logger.log("path: signer -> adapter, token: fromToken");
  await fromToken.transfer(adapter.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.callStatic.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);
  const receiptGetAmountOut = await adapter
    .getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr)
    .then(tx => tx.wait());
  const gasFeeGetAmountOut = calcGasFee(receiptGetAmountOut);

  // path: adapter -> signer, token: fromToken -> native
  logger.log("path: adapter -> signer, token: fromToken -> native");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = gasFee.add(await bcd.after());

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", {
    amountIn,
    amountOut,
    amountOutEstimated,
    amountOutError,
    swapOutput,
    gasFee,
    gasFeeGetAmountOut,
  });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};

/* ========================================================
 * adapter: balancer
 * fromToken: usdc
 * toToken: usdt
 * pool: (usdc, usdt)
 * ======================================================== */
export const testCommonAdapterBalancerTokenToToken = async (
  signer: SignerWithAddress,
  adapter: BalancerAdapter, // adapter which will be tested
  fromTokenAddr: string, // usdc
  toTokenAddr: string, // usdt
  poolAddr: string, // (usdc, usdt)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>,
  errorBound: BigNumber = BigNumber.from("0"),
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("testCommonAdapterBalancerTokenToToken: adapter not found");
    return;
  }

  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  await depositFromToken(signer, amountInForDeposit);
  const amountIn = await fromToken.balanceOf(signer.address);

  // path: signer -> adapter, token: fromToken
  logger.log("path: signer -> adapter, token: fromToken");
  await fromToken.transfer(adapter.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const amountOutEstimated = await adapter.callStatic.getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr);
  const receiptGetAmountOut = await adapter
    .getAmountOut(fromTokenAddr, amountIn, toTokenAddr, poolAddr)
    .then(tx => tx.wait());
  const gasFeeGetAmountOut = calcGasFee(receiptGetAmountOut);

  // path: adapter -> signer, token: fromToken -> toToken
  logger.log("path: adapter -> signer, token: fromToken -> toToken");
  await bcd.before();
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
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  logger.log("result", {
    amountIn,
    amountOut,
    amountOutEstimated,
    amountOutError,
    swapOutput,
    gasFee,
    gasFeeGetAmountOut,
  });

  // test
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
};
