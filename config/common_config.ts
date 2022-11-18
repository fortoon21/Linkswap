import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";

import { CurveAdapter, EllipsisAdapter, IERC20__factory, IWETH__factory, UniV2Adapter } from "../src/types";
import { logger } from "../test/logger";
import type { CurveDex, Oracles, Uni2Dex, Uni3Dex } from "./types";

export interface IConfig {
  // tokens: { native: string; wnative: string; usdc: string; usdt: string; bnbx: string };
  // uni2Pools: { poolWnativeUsdc: string; poolUsdcUsdt: string };
  // curvePools: { poolNativeBnbx: string; poolUsdcUsdt: string };
  tokens: any;
  uni2Pools: any;
  uni3Pools: any;

  curvePools: any;
  balancerPools: any;
  uni2Dexes: Uni2Dex[];
  curveDexes: CurveDex[];

  // depositUsdc(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: UniV2Adapter): Promise<void>;
  // depositBnbx(signer: SignerWithAddress, amountIn: ethers.BigNumber, adapter: EllipsisAdapter): Promise<void>;
}
