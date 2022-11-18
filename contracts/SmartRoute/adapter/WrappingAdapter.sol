// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;
import { IRouterAdapter } from "../intf/IRouterAdapter.sol";

import { IERC20 } from "../../intf/IERC20.sol";
import { UniERC20 } from "../../lib/UniERC20.sol";
import { IWETH } from "../../intf/IWETH.sol";
import "hardhat/console.sol";

contract WrappingAdapter is IRouterAdapter {
    using UniERC20 for IERC20;

    address public constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function getAmountOut(
        address,
        uint256 amountIn,
        address,
        address
    ) public pure override returns (uint256 _output) {
        _output = amountIn;
    }

    function swapExactIn(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address,
        address to
    ) external payable override returns (uint256 _output) {
        _output = amountIn;
        if (fromToken != toToken) {
            if (fromToken != _ETH_ADDRESS_) {
                IWETH(fromToken).withdraw(amountIn);
            }
            if (toToken != _ETH_ADDRESS_) {
                IWETH(toToken).deposit{ value: amountIn }();
            }
        }

        IERC20(toToken).uniTransfer(to, _output);
    }
}
