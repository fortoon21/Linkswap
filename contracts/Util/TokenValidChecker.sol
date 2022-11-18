// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { IUniswapV2Pair, IUniswapV2Factory } from "../SmartRoute/intf/IUniV2.sol";
import { MultiAMMLib } from "../lib/MultiAMMLib.sol";
import "hardhat/console.sol";
import { IERC20 } from "../intf/IERC20.sol";

interface IRouteProxy {
    function multiHopSingleSwap(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.Swap[] memory pathInfos,
        uint256 minReturnAmount,
        uint256 deadLine,
        uint16[2] memory isWETH
    ) external payable returns (uint256[] memory outputs);
}

contract TokenValidChecker {
    address private immutable router;
    address private immutable approve;
    address constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    constructor(address _router, address _approve) {
        router = _router;
        approve = _approve;
        // console.log("TokenValidChecker.validityCheck: router = %s", router);
    }

    receive() external payable {}

    function validityCheck(
        address factory,
        address adapter,
        uint16 poolEdition,
        address wnative,
        address[] memory tokens,
        uint256 amountIn
    ) public payable returns (uint256[] memory results) {
        // return case:
        // 0: white
        // 1: gray
        // 2: black
        console.log("TokenValidChecker.validityCheck:");
        // console.log("TokenValidChecker.validityCheck: tokens.length = %d", tokens.length);
        results = new uint256[](tokens.length);
        for (uint256 i; i < tokens.length; i++) {
            address token = tokens[i];
            address pool = IUniswapV2Factory(factory).getPair(wnative, token);
            console.log("TokenValidChecker.validityCheck: ** iteration %d **", i);
            // console.log("TokenValidChecker.validityCheck: token = %s", token);
            // console.log("TokenValidChecker.validityCheck: pool = %s", pool);

            if (pool == address(0)) {
                results[i] = 1;
            } else {
                // console.log("TokenValidChecker.validityCheck: MultiAMMLib.Swap");
                MultiAMMLib.Swap[] memory pathInfos = new MultiAMMLib.Swap[](1);
                pathInfos[0] = MultiAMMLib.Swap({
                    fromToken: _ETH_ADDRESS_,
                    amountIn: amountIn,
                    toToken: token,
                    // to: msg.sender,
                    to: address(this),
                    pool: pool,
                    adapter: adapter,
                    poolEdition: poolEdition
                });

                // console.log("TokenValidChecker.validityCheck: multiHopSingleSwap");
                // IRouteProxy(router).multiHopSingleSwap{ value: amountIn }(
                //     _ETH_ADDRESS_,
                //     amountIn,
                //     tokens[i],
                //     pathInfos,
                //     1,
                //     type(uint256).max,
                //     [uint16(0), uint16(0)]
                // );

                // console.log("TokenValidChecker.validityCheck: multiHopSingleSwap done");
                try
                    IRouteProxy(router).multiHopSingleSwap{ value: amountIn }(
                        _ETH_ADDRESS_,
                        amountIn,
                        tokens[i],
                        pathInfos,
                        1,
                        type(uint256).max,
                        [uint16(0), uint16(0)]
                    )
                returns (uint256[] memory outs) {
                    MultiAMMLib.Swap[] memory pathInfos = new MultiAMMLib.Swap[](1);
                    uint256 amountIn = outs[outs.length - 1];
                    pathInfos[0] = MultiAMMLib.Swap({
                        fromToken: token,
                        amountIn: amountIn,
                        toToken: _ETH_ADDRESS_,
                        to: msg.sender,
                        // to: address(this),
                        pool: pool,
                        adapter: adapter,
                        poolEdition: poolEdition
                    });
                    // results[i] = 0;
                    IERC20(token).approve(approve, amountIn);
                    try
                        IRouteProxy(router).multiHopSingleSwap(
                            tokens[i],
                            amountIn,
                            _ETH_ADDRESS_,
                            pathInfos,
                            1,
                            type(uint256).max,
                            [uint16(0), uint16(0)]
                        )
                    {
                        results[i] = 0;
                    } catch {
                        results[i] = 2;
                    }
                } catch {
                    results[i] = 2;
                }
            }
        }
    }
}
