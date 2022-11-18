import { ethers } from "ethers";
import { HardhatEthersHelpers } from "hardhat/types";

import { config as arbitrum_config } from "./arbitrum_config";
import { config as avalanche_config } from "./avalanche_config";
import { config as bsc_config } from "./bsc_config";
import { config as matic_config } from "./matic_config";
import { ChainConfig } from "./types";

// const chainIds = {
//   "arbitrum-mainnet": 42161,
//   hardhat: 31337,
//   "eth-mainnet": 1,
//   "avalanche-mainnet": 43114,
//   "bsc-mainnet": 56,
//   "klaytn-mainnet": 8217,
//   "celo-mainnet": 42220,
//   "aurora-mainnet": 1313161554,
//   "optimism-mainnet": 10,
//   "polygon-mainnet": 137,
//   "polygon-mumbai": 80001,
//   rinkeby: 4,
//   "osmosis-mainnet": 0,
//   "solana-mainnet": 0,
//   "near-mainnet": 0,
//   "sui-testnet": 0,
//   "evmos-mainnet": 9001,
// };

export async function loadConfig(eth: typeof ethers & HardhatEthersHelpers): Promise<ChainConfig> {
  const provider = await eth.getSigners().then(signers => signers[0].provider);
  if (!provider) {
    throw new Error("Unexpected error");
  }

  const chainId = await provider.getNetwork().then(n => n.chainId);

  if (chainId == 56) {
    return bsc_config;
  } else if (chainId == 42161) {
    return arbitrum_config;
  } else if (chainId == 43114) {
    return avalanche_config;
  } else if (chainId == 137) {
    return matic_config;
  }

  throw new Error("not supported chain! " + chainId);
}

export enum Chain {
  Bsc,
  Polygon,
  Tron,
  Arbitrum,
  Avalanche,
}
export async function getChain(eth: typeof ethers & HardhatEthersHelpers): Promise<Chain> {
  const provider = await eth.getSigners().then(signers => signers[0].provider);
  if (!provider) {
    throw new Error("Unexpected error");
  }

  const chainId = await provider.getNetwork().then(n => n.chainId);

  const map = {
    56: Chain.Bsc,
    137: Chain.Polygon,
    42161: Chain.Arbitrum,
    43114: Chain.Avalanche,
  } as any;

  if (!(chainId in map)) throw new Error("not supported chain! " + chainId);

  return map[chainId];
}
