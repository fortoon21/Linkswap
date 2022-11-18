import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractReceipt } from "ethers";
import { ethers } from "hardhat";

import { Approve, EllipsisAdapter, IERC20, IERC20__factory, RouteProxy, UniV2Adapter } from "../../src/types";
import { MultiAMMLib } from "../../src/types/SmartRoute/proxies/RouteProxy";
import { logger } from "../logger";
import { NativeBalanceChangeDetector, TokenBalanceChangeDetector } from "../utils";

export function calcGasFee(receipt: ContractReceipt) {
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

/* ========================================================
 * fromToken: native
 * toToken: usdc
 * ======================================================== */
export const testCommonSplitRouteNativeToToken = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  linearWeightPathInfo: MultiAMMLib.LinearWeightedSwapStruct,
  flashDes: MultiAMMLib.FlashLoanDesStruct[],
  fromTokenAddr: string, // native
  toTokenAddr: string, // usdc
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // path: route -> signer, token: native -> toToken
  logger.log("path: route -> signer, token: native -> toToken");
  await bcd.before();
  const receipt = await routeProxy
    .shieldSwap(fromTokenAddr, amountIn, toTokenAddr, linearWeightPathInfo, flashDes, 1, 1e10, [0, 0], {
      value: amountIn,
    })
    .then(tx => tx.wait());
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  logger.log("result", { amountIn, amountOut, gasFee });

  // test
  expect(receipt.status).be.equal(1);
};

/* ========================================================
 * fromToken: native
 * toToken: usdc
 * ======================================================== */
export const testCommonRouteShieldSwapNativeToToken = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  linearWeightPathInfo: MultiAMMLib.LinearWeightedSwapStruct,
  fromTokenAddr: string, // native
  amountIn: BigNumber, // 1 eth
  toTokenAddr: string, // usdc
  amountOutEstimatedFromServer: BigNumber, // expected out amount calculed in quote server
  errorBound: BigNumber = BigNumber.from("0"),
) => {
  /* ---------------------------- setup ---------------------------- */
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // path: route -> signer, token: native -> toToken
  logger.log("path: route -> signer, token: native -> toToken");
  await bcd.before();
  const amountOutEstimated = await routeProxy.callStatic.getLinearSplitMultiHopMultiSwapOut(
    fromTokenAddr,
    amountIn,
    toTokenAddr,
    linearWeightPathInfo,
  );
  const receipt = await routeProxy
    .shieldSwap(fromTokenAddr, amountIn, toTokenAddr, linearWeightPathInfo, [], 1, 1e10, [0, 0], { value: amountIn })
    .then(tx => tx.wait());
  const gasFee = calcGasFee(receipt);
  const amountOut = await bcd.after();

  // log
  const amountOutError = amountOut.sub(amountOutEstimated).abs();
  const amountOutErrorFromServer = amountOut.sub(amountOutEstimatedFromServer).abs();
  logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, amountOutErrorFromServer, gasFee });

  // tests
  expect(receipt.status).be.equal(1);
  expect(amountOutError).be.lessThanOrEqual(errorBound);
  // expect(amountOutErrorFromServer).be.lessThanOrEqual(errorBound); // may not be 0 due to slippage
};

/* ========================================================
 * adapter: univ2
 * fromToken: native
 * toToken: usdc
 * ======================================================== */
export const testCommonRouteUniv2NativeToToken = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  adapter: UniV2Adapter, // adapter which will be tested
  fromTokenAddr: string, // native
  toTokenAddr: string, // usdc
  poolAddr: string, // (wnative, usdc)
  errorBound: BigNumber = BigNumber.from("0"),
  poolEdition: number = 0,
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // path: signer -> route, token: native
  // await signer.sendTransaction({ value: amountIn, to: routeProxy.address, gasLimit: 3e7 }).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const pathInfos = [
    {
      fromToken: fromTokenAddr,
      amountIn,
      toToken: toTokenAddr,
      to: signer.address,
      pool: poolAddr,
      adapter: adapter.address,
      poolEdition,
    },
  ];
  const amountOutEstimated = (
    await routeProxy.callStatic.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos)
  )[1];
  await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

  // path: route -> signer, token: native -> toToken
  logger.log("path: route -> signer, token: native -> toToken");
  await bcd.before();
  const swapOutput = await routeProxy.callStatic.multiHopSingleSwap(
    fromTokenAddr,
    amountIn,
    toTokenAddr,
    pathInfos,
    1,
    1e10,
    [0, 0],
    { value: amountIn },
  );
  const receipt = await routeProxy
    .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0], { value: amountIn })
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
 * adapter: univ2
 * fromToken: usdc
 * toToken: native
 * ======================================================== */
export const testCommonRouteUniv2TokenToNative = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  approve: Approve,
  adapter: UniV2Adapter, // adapter which will be tested
  fromTokenAddr: string, // usdc
  toTokenAddr: string, // native
  poolAddr: string, // (usdc, native)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>,
  errorBound: BigNumber = BigNumber.from("0"),
  poolEdition: number = 0,
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new NativeBalanceChangeDetector(signer);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("testCommonRouteUniv2TokenToNative: adapter not found");
    return;
  }
  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  // logger.log({ signer: { usdc: { balance: await fromToken.balanceOf(signer.address) } } });
  await depositFromToken(signer, amountInForDeposit);
  // logger.log({ signer: { usdc: { balance: await fromToken.balanceOf(signer.address) } } });
  const amountIn = await fromToken.balanceOf(signer.address);

  // path: signer -> route, token: fromToken
  // logger.log({ route: { usdc: { balance: await fromToken.balanceOf(routeProxy.address) } } });
  // logger.log("path: signer -> route, token: fromToken");
  // await fromToken.transfer(routeProxy.address, amountIn).then(tx => tx.wait());
  // logger.log({ route: { usdc: { balance: await fromToken.balanceOf(routeProxy.address) } } });

  // approve: signer -> route, token: fromToken
  await fromToken.approve(approve.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const pathInfos = [
    {
      fromToken: fromTokenAddr,
      amountIn,
      toToken: toTokenAddr,
      to: signer.address,
      pool: poolAddr,
      adapter: adapter.address,
      poolEdition,
    },
  ];
  const amountOutEstimated = (
    await routeProxy.callStatic.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos)
  )[1];
  await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

  // path: route -> signer, token: fromToken -> native
  logger.log("path: route -> signer, token: fromToken -> native");
  await bcd.before();
  const swapOutput = await routeProxy.callStatic.multiHopSingleSwap(
    fromTokenAddr,
    amountIn,
    toTokenAddr,
    pathInfos,
    1,
    1e10,
    [0, 0],
  );
  const receipt = await routeProxy
    .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0])
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
 * adapter: univ2
 * fromToken: usdc
 * toToken: usdt
 * ======================================================== */
export const testCommonRouteUniv2TokenToToken = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  approve: Approve,
  adapter: UniV2Adapter, // adapter which will be tested
  fromTokenAddr: string, // usdc
  toTokenAddr: string, // usdt
  poolAddr: string, // (usdc, usdt)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>, // deposit bnbx
  errorBound: BigNumber = BigNumber.from("0"),
  poolEdition: number = 0,
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- assert ---------------------------- */
  if (!adapter) {
    logger.log("testCommonRouteUniv2TokenToToken: adapter not found");
    return;
  }
  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  await depositFromToken(signer, amountInForDeposit);
  const amountIn = await fromToken.balanceOf(signer.address);

  // approve: signer -> route, token: fromToken
  logger.log("approve: signer -> route, token: fromToken");
  await fromToken.approve(approve.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const pathInfos = [
    {
      fromToken: fromTokenAddr,
      amountIn,
      toToken: toTokenAddr,
      to: signer.address,
      pool: poolAddr,
      adapter: adapter.address,
      poolEdition,
    },
  ];

  const amountOutEstimated = (
    await routeProxy.callStatic.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos)
  )[1];
  await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

  // path: route -> signer, token: fromToken -> native
  logger.log("path: route -> signer, token: fromToken -> native");
  await bcd.before();
  const swapOutput = await routeProxy.callStatic.multiHopSingleSwap(
    fromTokenAddr,
    amountIn,
    toTokenAddr,
    pathInfos,
    1,
    1e10,
    [0, 0],
  );
  const receipt = await routeProxy
    .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0])
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

// /* ========================================================
//  * adapter: univ2 (meshswap)
//  * fromToken: native
//  * toToken: usdt
//  * ======================================================== */
// export const testCommonRouteTrashUniv2NativeToToken = async (
//   signer: SignerWithAddress,
//   routeProxy: RouteProxy, // routeProxy which will be tested
//   adapter: UniV2Adapter, // adapter which will be tested
//   fromTokenAddr: string, // native
//   toTokenAddr: string, // usdt
//   poolAddr: string, // (wnative, usdt)
//   errorBound: BigNumber = BigNumber.from("0"),
// ) => {
//   /* ---------------------------- hyperparam ---------------------------- */
//   const amountIn = ethers.utils.parseEther("1");

//   /* ---------------------------- setup ---------------------------- */
//   const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

//   /* ---------------------------- run ---------------------------- */
//   // estimate amountOut
//   logger.log("estimate amountOut");
//   const pathInfos = [
//     {
//       fromToken: fromTokenAddr,
//       amountIn,
//       toToken: toTokenAddr,
//       to: signer.address,
//       pool: poolAddr,
//       adapter: adapter.address,
//       poolEdition: 2, // meshswah: trash univ2 --> poolEdition = 2
//     },
//   ];
//   const amountOutEstimated = (
//     await routeProxy.callStatic.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos)
//   )[1];
//   await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

//   // path: route -> signer, token: native -> toToken
//   logger.log("path: route -> signer, token: native -> toToken");
//   await bcd.before();
//   const swapOutput = await routeProxy.callStatic.multiHopSingleSwap(
//     fromTokenAddr,
//     amountIn,
//     toTokenAddr,
//     pathInfos,
//     1,
//     1e10,
//     [0, 0],
//     { value: amountIn },
//   );
//   const receipt = await routeProxy
//     .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0], { value: amountIn })
//     .then(tx => tx.wait());
//   const gasFee = calcGasFee(receipt);
//   const amountOut = await bcd.after();

//   // log
//   const amountOutError = amountOut.sub(amountOutEstimated).abs();
//   logger.log("result", { amountIn, amountOut, amountOutEstimated, amountOutError, swapOutput, gasFee });

//   // test
//   expect(receipt.status).be.equal(1);
//   expect(amountOutError).be.lessThanOrEqual(errorBound);
// };

/* ========================================================
 * adapter: ellipsis
 * fromToken: native
 * toToken: bnbx
 * ======================================================== */
export const testCommonRouteEllipsisNativeToToken = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  adapter: EllipsisAdapter, // adapter which will be tested
  fromTokenAddr: string, // native
  toTokenAddr: string, // bnbx
  poolAddr: string, // (native, bnbx)
  errorBound: BigNumber = BigNumber.from("100000000"), // curve may ignore last 8 significant digit
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountIn = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // estimate amountOut
  logger.log("estimate amountOut");
  const pathInfos = [
    {
      fromToken: fromTokenAddr,
      amountIn,
      toToken: toTokenAddr,
      to: signer.address,
      pool: poolAddr,
      adapter: adapter.address,
      poolEdition: 1,
    },
  ];
  const amountOutEstimated = (
    await routeProxy.callStatic.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos)
  )[1];
  await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

  // path: route -> signer, token: native -> toToken
  logger.log("path: route -> signer, token: native -> toToken");
  await bcd.before();
  const receipt = await routeProxy
    .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0], { value: amountIn })
    .then(tx => tx.wait());
  const swapOutput = await routeProxy.callStatic.multiHopSingleSwap(
    fromTokenAddr,
    amountIn,
    toTokenAddr,
    pathInfos,
    1,
    1e10,
    [0, 0],
    { value: amountIn },
  );
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
export const testCommonRouteEllipsisTokenToNative = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  approve: Approve,
  adapter: EllipsisAdapter, // adapter which will be tested
  fromTokenAddr: string, // bnbx
  toTokenAddr: string, // native
  poolAddr: string, // (native, bnbx)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>, // deposit bnbx
  errorBound: BigNumber = BigNumber.from("100000000"), // curve may ignore last 8 significant digit
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new NativeBalanceChangeDetector(signer);

  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  await depositFromToken(signer, amountInForDeposit);
  const amountIn = await fromToken.balanceOf(signer.address);

  // approve: signer -> route, token: fromToken
  logger.log("approve: signer -> route, token: fromToken");
  await fromToken.approve(approve.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const pathInfos = [
    {
      fromToken: fromTokenAddr,
      amountIn,
      toToken: toTokenAddr,
      to: signer.address,
      pool: poolAddr,
      adapter: adapter.address,
      poolEdition: 1,
    },
  ];
  const amountOutEstimated = (
    await routeProxy.callStatic.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos)
  )[1];
  await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

  // path: route -> signer, token: fromToken -> native
  logger.log("path: route -> signer, token: fromToken -> native");
  await bcd.before();
  const swapOutput = (
    await routeProxy.callStatic.multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0])
  )[1];
  const receipt = await routeProxy
    .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0])
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
export const testCommonRouteEllipsisTokenToToken = async (
  signer: SignerWithAddress,
  routeProxy: RouteProxy, // routeProxy which will be tested
  approve: Approve,
  adapter: EllipsisAdapter, // adapter which will be tested
  fromTokenAddr: string, // usdc
  toTokenAddr: string, // usdt
  poolAddr: string, // (usdc, usdt)
  depositFromToken: (signer: SignerWithAddress, amountIn: BigNumber) => Promise<void>, // deposit usdc
  errorBound: BigNumber = BigNumber.from("100000000"), // curve may ignore last 8 significant digit
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  const amountInForDeposit = ethers.utils.parseEther("1");

  /* ---------------------------- setup ---------------------------- */
  const fromToken = IERC20__factory.connect(fromTokenAddr, signer);
  const bcd = new TokenBalanceChangeDetector(signer, toTokenAddr);

  /* ---------------------------- run ---------------------------- */
  // deposit fromToken
  logger.log("deposit fromToken");
  await depositFromToken(signer, amountInForDeposit);
  const amountIn = await fromToken.balanceOf(signer.address);

  // approve: signer -> route, token: fromToken
  logger.log("approve: signer -> route, token: fromToken");
  await fromToken.approve(approve.address, amountIn).then(tx => tx.wait());

  // estimate amountOut
  logger.log("estimate amountOut");
  const pathInfos = [
    {
      fromToken: fromTokenAddr,
      amountIn,
      toToken: toTokenAddr,
      to: signer.address,
      pool: poolAddr,
      adapter: adapter.address,
      poolEdition: 1,
    },
  ];
  const amountOutEstimated = (
    await routeProxy.callStatic.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos)
  )[1];
  await routeProxy.getMultiHopSingleSwapOut(fromTokenAddr, amountIn, toTokenAddr, pathInfos).then(tx => tx.wait());

  // path: route -> signer, token: fromToken -> token
  logger.log("path: route -> signer, token: fromToken -> token");
  await bcd.before();
  const swapOutput = (
    await routeProxy.callStatic.multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0])
  )[1];
  const receipt = await routeProxy
    .multiHopSingleSwap(fromTokenAddr, amountIn, toTokenAddr, pathInfos, 1, 1e10, [0, 0])
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
