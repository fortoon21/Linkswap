import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { task } from "hardhat/config";
import type { HardhatEthersHelpers, TaskArguments } from "hardhat/types";
import * as _ from "lodash";
import * as path from "path";
import * as util from "util";

import { loadConfig } from "../config";
import { bscGrayTokens } from "../config/bsc_gray_tokens";
import { polygonGrayTokens } from "../config/polygon_gray_tokens";
import { TokenValidChecker } from "../src/types";
import { logger } from "../test/logger";

const taskTokenValidCheck = async (
  ethers: HardhatEthersHelpers & typeof import("/home/hosan/contract/smc-solidity/node_modules/ethers/lib/ethers"),
  tokenValidChecker: TokenValidChecker,
  factoryAddr: string,
  adapterAddr: string,
  poolEdition: number,
  wnative: string,
  tokens: string[],
  outPath: string,
  amountIn: BigNumber,
  numChunk: number,
) => {
  /* ---------------------------- hyperparam ---------------------------- */
  // const amountIn = ethers.utils.parseEther("0.3");
  // const numChunk = 1;

  /* ---------------------------- run ---------------------------- */
  // function sleep(ms: number) {
  //   return new Promise(res => setTimeout(res, ms));
  // }

  // const promiseAllSequentialMap = async <T, E>(arr: T[], callback: (e: T, idx: number) => Promise<E>) => {
  //   let idx = 0;
  //   const out = [];
  //   for (const elem of arr) {
  //     out.push(await callback(elem, idx));
  //     await sleep(500);
  //     idx++;
  //   }
  //   return out;
  // };

  // const output = _.flatten(
  //   await promiseAllSequentialMap(_.chunk(tokens, numChunk), async (tokenChunk, idx) => {
  //     logger.log(`testCommonTokenValidChecker: idx=${idx}: start`);
  //     const out: BigNumber[] = await tokenValidChecker.callStatic.validityCheck(
  //       factoryAddr,
  //       adapterAddr,
  //       poolEdition,
  //       wnative,
  //       tokenChunk,
  //       amountIn,
  //       {
  //         value: amountInBulk,
  //       },
  //     );
  //     logger.log(`testCommonTokenValidChecker: idx=${idx}: done`);
  //     return out;
  //   }),
  // ).map(e => e.toNumber());

  const amountInBulk = amountIn.mul(numChunk);

  const output = _.flatten(
    await Promise.all(
      _.chunk(tokens, numChunk).map(async (tokenChunk, idx) => {
        logger.log(`testCommonTokenValidChecker: idx=${idx}: start`);
        const out: BigNumber[] = await tokenValidChecker.callStatic.validityCheck(
          factoryAddr,
          adapterAddr,
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
    ),
  ).map(e => e.toNumber());

  logger.log({ output, outPath });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output));
};

task("polygon:scratch").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const scratch = await ethers
    .getContractFactory("Scratch")
    .then(f => f.deploy())
    .then(c => c.deployed());
  const out = await scratch.scratch1();
  logger.log({ out });
});

task("polygon:tokenValidCheck").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  /* ---------------------------- args ---------------------------- */
  const config = await loadConfig(ethers);
  const tokenValidChecker = await ethers
    .getContractFactory("TokenValidChecker")
    .then(f => f.attach(config.Deployed.TokenValidChecker));
  const univ2AdapterAddr = config.Deployed.UniV2Adapter;
  const trashuniv2AdapterAddr = (config as any).Deployed.MeshAdapter; //config.Deployed.TrashUniV2Adapter;
  const wnative = config.WETH;
  const amountIn = ethers.utils.parseEther("30");
  const numChunk = 1;

  /* ----------------------------  ---------------------------- */
  await taskTokenValidCheck(
    ethers,
    tokenValidChecker,
    config.Uni2Dexes[0].factory,
    univ2AdapterAddr,
    0,
    wnative,
    polygonGrayTokens,
    `analysis/polygon/0-tokenValidChecker.json`,
    amountIn,
    numChunk,
  );

  await taskTokenValidCheck(
    ethers,
    tokenValidChecker,
    config.Uni2Dexes[1].factory,
    univ2AdapterAddr,
    0,
    wnative,
    polygonGrayTokens,
    `analysis/polygon/1-tokenValidChecker.json`,
    amountIn,
    numChunk,
  );

  await taskTokenValidCheck(
    ethers,
    tokenValidChecker,
    config.Uni2Dexes[2].factory,
    trashuniv2AdapterAddr,
    2,
    wnative,
    polygonGrayTokens,
    `analysis/polygon/2-tokenValidChecker.json`,
    amountIn,
    numChunk,
  );

  await taskTokenValidCheck(
    ethers,
    tokenValidChecker,
    config.Uni2Dexes[3].factory,
    univ2AdapterAddr,
    0,
    wnative,
    polygonGrayTokens,
    `analysis/polygon/3-tokenValidChecker.json`,
    amountIn,
    numChunk,
  );
});

task("bsc:tokenValidCheck").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  /* ---------------------------- args ---------------------------- */
  const config = await loadConfig(ethers);
  const tokenValidChecker = await ethers
    .getContractFactory("TokenValidChecker")
    .then(f => f.attach(config.Deployed.TokenValidChecker));
  const univ2AdapterAddr = config.Deployed.UniV2Adapter;
  const wnative = config.WETH;
  const amountIn = ethers.utils.parseEther("0.2");
  const numChunk = 1;

  /* ----------------------------  ---------------------------- */
  await taskTokenValidCheck(
    ethers,
    tokenValidChecker,
    config.Uni2Dexes[0].factory,
    univ2AdapterAddr,
    0,
    wnative,
    bscGrayTokens,
    `analysis/bsc/0-tokenValidChecker.json`,
    amountIn,
    numChunk,
  );

  await taskTokenValidCheck(
    ethers,
    tokenValidChecker,
    config.Uni2Dexes[1].factory,
    univ2AdapterAddr,
    0,
    wnative,
    bscGrayTokens,
    `analysis/bsc/1-tokenValidChecker.json`,
    amountIn,
    numChunk,
  );
});
