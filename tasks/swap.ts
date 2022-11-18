import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import * as util from "util";

import { loadConfig } from "../config";

task("swap:test").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const config = await loadConfig(ethers);

  const signers: SignerWithAddress[] = await ethers.getSigners();
  const input = ethers.utils.parseUnits("1", 18).toString();
  const response = await axios.post(`${process.env.API_SERVER_ENDPOINT}/v1/quote/calculate`, {
    options: {
      tokenInAddr: config.coin,
      tokenOutAddr: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      from: signers[0].address,
      amount: input,
      slippageBps: 50,
      maxEdge: 5,
      maxSplit: 20,
      withCycle: false,
    },
  });
  const txBytes = response.data.metamaskSwapTransaction.data as string;

  const expectedAmountOut = BigNumber.from(response.data.dexAgg.expectedAmountOut);
  console.log("From 1 matic to USDT");
  console.log("Expected: ", ethers.utils.formatUnits(expectedAmountOut, 6), "USDT");

  const routeProxyFactory = await ethers.getContractFactory("RouteProxy");
  const args = routeProxyFactory.interface.decodeFunctionData("shieldSwap", txBytes);
  console.log(util.inspect(args, false, null, true /* enable colors */));

  await signers[0]
    .sendTransaction({
      to: config.Deployed.RouteProxy,
      from: signers[0].address,
      gasLimit: 5000000,
      data: txBytes,
      value: input,
    })
    .then(async tx => {
      const receipt = await tx.wait();
      console.log("swap tx done", receipt.transactionHash);
      if (receipt.status == 0) {
        console.log("swap succeed");
      } else {
        console.log("swap failed");
      }
    })
    .catch(e => {
      console.log("swap failed");
      console.log(e.message);
    });
});
