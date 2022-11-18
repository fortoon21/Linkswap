// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";
import { IUniV3Pair, IUniswapV3SwapCallback, ITickLens } from "../SmartRoute/intf/IUniV3.sol";
import "./intf/IUniswapV3PoolInfoViewer.sol";

/*
 * @dev: for test only
 */
import "hardhat/console.sol";

// optimizer run : 1000000
contract UniV3Viewer is IUniswapV3PoolInfoViewer {
    function getPoolInfo(address pool) public view override returns (UniswapV3PoolInfo memory) {
        IUniV3Pair uniswapV3Pool = IUniV3Pair(pool);
        address[] memory tokenList = new address[](2);
        tokenList[0] = uniswapV3Pool.token0();
        tokenList[1] = uniswapV3Pool.token1();
        (uint160 sqrtPriceX96, int24 tick, , , , uint8 feeProtocol, bool unlocked) = uniswapV3Pool.slot0();
        int24 tickSpacing = uniswapV3Pool.tickSpacing();

        return
            UniswapV3PoolInfo({
                pool: pool,
                tokenList: tokenList,
                block_timestamp: uint32(block.timestamp),
                sqrtPriceX96: sqrtPriceX96,
                liquidity: uniswapV3Pool.liquidity(),
                fee: uniswapV3Pool.fee(),
                tick: tick,
                tickSpacing: tickSpacing,
                feeProtocol: feeProtocol,
                unlocked: unlocked
            });
    }

    function getPopulatedTicksInWordWithOffset(
        address pool,
        int16 tickBitmapIndex,
        uint24 offsetLeft,
        uint24 offsetRight
    ) public view returns (ITickLens.PopulatedTick[] memory populatedTicks) {
        // fetch bitmap
        uint256 bitmap = IUniV3Pair(pool).tickBitmap(tickBitmapIndex);

        // calculate the number of populated ticks
        uint256 numberOfPopulatedTicks;
        for (uint256 i = offsetLeft; i < offsetRight; i++) {
            if (bitmap & (1 << i) > 0) numberOfPopulatedTicks++;
        }

        // fetch populated tick data
        int24 tickSpacing = IUniV3Pair(pool).tickSpacing();
        populatedTicks = new ITickLens.PopulatedTick[](numberOfPopulatedTicks);
        for (uint256 i = offsetLeft; i < offsetRight; i++) {
            if (bitmap & (1 << i) > 0) {
                int24 populatedTick = ((int24(tickBitmapIndex) << 8) + int24(int256(i))) * tickSpacing;
                (uint128 liquidityGross, int128 liquidityNet, , , , , , ) = IUniV3Pair(pool).ticks(populatedTick);
                populatedTicks[--numberOfPopulatedTicks] = ITickLens.PopulatedTick({
                    tick: populatedTick,
                    liquidityNet: liquidityNet,
                    liquidityGross: liquidityGross
                });
            }
        }
    }

    function getPopulatedTicksInCurretWordWithOffset(
        address pool,
        uint24 offsetLeft,
        uint24 offsetRight
    ) public view returns (ITickLens.PopulatedTick[] memory populatedTicks) {
        return getPopulatedTicksInWordWithOffset(pool, getCurrentWordPos(pool), offsetLeft, offsetRight);
    }

    function getPopulatedTicksInWord(address pool, int16 wordPos)
        public
        view
        returns (ITickLens.PopulatedTick[] memory populatedTicks)
    {
        return this.getPopulatedTicksInWordWithOffset(pool, wordPos, 0, 256);
    }

    function getCurrentWordPos(address pool) public view returns (int16) {
        IUniV3Pair uniswapV3Pool = IUniV3Pair(pool);

        (, int24 tick, , , , , ) = uniswapV3Pool.slot0();
        return int16((tick / uniswapV3Pool.tickSpacing()) >> 8);
    }

    function getCurrentPopulatedTicks(address pool)
        public
        view
        returns (ITickLens.PopulatedTick[] memory populatedTicks)
    {
        return this.getPopulatedTicksInWordWithOffset(pool, getCurrentWordPos(pool), 0, 256);
    }

    function getCheapPopulatedTicks(address pool)
        public
        view
        returns (ITickLens.PopulatedTick[] memory populatedTicks)
    {
        return this.getPopulatedTicksInWordWithOffset(pool, getCurrentWordPos(pool) - 1, 0, 256);
    }

    function getExpensivePopulatedTicks(address pool)
        public
        view
        returns (ITickLens.PopulatedTick[] memory populatedTicks)
    {
        return this.getPopulatedTicksInWordWithOffset(pool, getCurrentWordPos(pool) + 1, 0, 256);
    }
}
