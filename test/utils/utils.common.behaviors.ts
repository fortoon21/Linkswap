import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractReceipt } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import * as _ from "lodash";
import * as path from "path";

import { TrashUniV2Adapter, UniV2Adapter } from "../../src/types";
import { TokenValidChecker } from "../../src/types/Util/TokenValidChecker.sol";
import { logger } from "../logger";

export function calcGasFee(receipt: ContractReceipt) {
  return receipt.gasUsed.mul(receipt.effectiveGasPrice);
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/** =======================================================
 *  classifiy token into white-token, gray-token, black-token
 * ======================================================== */
export const testCommonTokenValidChecker = async (
  signer: SignerWithAddress,
  tokenValidChecker: TokenValidChecker,
  factoryAddr: string,
  adapter: UniV2Adapter | TrashUniV2Adapter,
  poolEdition: number,
  wnative: string,
  tokens: string[],
  outPath: string,
  amountIn: BigNumber,
  numChunk: number,
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  // const numChunk = 10; //52=3:30 //10=3:20
  // const amountIn = ethers.utils.parseEther("10");
  /* ---------------------------- run ---------------------------- */
  const promiseAllSequentialMap = async <T, E>(arr: T[], callback: (e: T, idx: number) => Promise<E>) => {
    let idx = 0;
    const out = [];
    for (const elem of arr) {
      out.push(await callback(elem, idx));
      await sleep(100);
      idx++;
    }
    return out;
  };

  const amountInBulk = amountIn.mul(numChunk);
  const output = _.flatten(
    await promiseAllSequentialMap(_.chunk(tokens, numChunk), async (tokenChunk, idx) => {
      logger.log(`testCommonTokenValidChecker: idx=${idx}: start`);
      const out = await tokenValidChecker.callStatic.validityCheck(
        factoryAddr,
        adapter.address,
        poolEdition,
        wnative,
        tokenChunk,
        amountIn,
        {
          value: amountInBulk,
        },
      );
      logger.log(`testCommonTokenValidChecker: idx=${idx}: done`);
      return out;
    }),
  ).map(e => e.toNumber());

  logger.log({ output, outPath });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output));
};
