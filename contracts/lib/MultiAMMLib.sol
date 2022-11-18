// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

library MultiAMMLib {
    enum DexType {
        UNI2,
        CURVE,
        BALANCER,
        UNI3
        // DODO,
        // KYBERDMM
        // STABLESWAP,
        // SADDLE
    }
    //dexType:
    // 0: uniswapV2
    // 1: curve
    // 2: balancer
    // 3: uniswapV3
    // 4: dodo - proactive
    // 5: Kyber dmm
    // 6: stable swap
    // 7: saddle

    /**
    fromToken: input addr
    amountIn: input amount
    toToken: output addr
    to: 최종적으로 swap된 결과물을 받을 address (보통 signer)
    adapter: swap을 수행해줄 adapter address (ex: uniV2Adapter)
    poolEdition:
        1: pool이 직접 fromToken을 가져가는 경우 (router -> pool한테 approve만 함)
        0: pool이 직접 fromToken을 안가져가는 경우 (router -> pool한테 transfer함)
        (fromToken = native 이면 항상 0 으로 둬야했으나, 안에서 wnative 로 바꾸기 때문에 다른 일반 토큰처럼 취급하면된다)
        ex: poolEdition = 0 case: univ2, dodo-v1
        ex: poolEdition = 1 case: univ3, dodo-v2, balancer, curve-{v1,v2}
     */

    struct Swap {
        address fromToken;
        uint256 amountIn;
        address toToken;
        address to;
        address pool;
        address adapter;
        uint16 poolEdition;
    }

    struct WeightedSwap {
        address fromToken;
        uint256 amountIn;
        address toToken;
        address to;
        address[] pools;
        uint256[] weights;
        address[] adapters;
        uint16[] poolEditions;
    }

    struct LinearWeightedSwap {
        address fromToken;
        uint256 amountIn;
        address toToken;
        address to;
        uint256[] weights;
        WeightedSwap[][] weightedSwaps;
    }

    struct FlashLoanDes {
        address asset;
        uint256 amountIn;
        Swap[] swaps;
        uint256 estimatedGas;
    }
}
