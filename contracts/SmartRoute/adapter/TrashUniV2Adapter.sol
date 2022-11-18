// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;
import { ReentrancyGuard } from "../../lib/ReentrancyGuard.sol";
import { IRouterAdapter } from "../intf/IRouterAdapter.sol";
import { IUniswapV2Pair, IUniswapV2Viewer, IMeshswapRouter } from "../intf/IUniV2.sol";

import { IERC20 } from "../../intf/IERC20.sol";
import { UniERC20 } from "../../lib/UniERC20.sol";
import { SafeMath } from "../../lib/SafeMath.sol";
import "hardhat/console.sol";

contract TrashUniV2Adapter is IRouterAdapter {
    using SafeMath for uint256;
    using UniERC20 for IERC20;
    address public immutable uni2Viewer;
    address private MeshRouter = 0x10f4A785F458Bc144e3706575924889954946639;
    address private MeshFactory = 0x9F3044f7F9FC8bC9eD615d54845b4577B833282d;

    constructor(address _uni2Viewer) {
        uni2Viewer = _uni2Viewer;
    }

    function factory(address pool) public view returns (address) {
        return IUniswapV2Pair(pool).factory();
    }

    function getAmountOut(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool
    ) public view override returns (uint256 _output) {
        require(amountIn > 0, "UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT");

        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pool).getReserves();
        require(reserve0 > 0 && reserve1 > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");

        uint256 reserveInput;
        uint256 reserveOutput;
        address token0 = IUniswapV2Pair(pool).token0();
        address token1 = IUniswapV2Pair(pool).token1();
        if (fromToken == token0) {
            (reserveInput, reserveOutput) = (reserve0, reserve1);
            require(toToken == token1, "invalid token pair");
        } else if (toToken == token0) {
            (reserveInput, reserveOutput) = (reserve1, reserve0);
            require(fromToken == token1, "invalid token pair");
        } else {
            revert("invalid token pair");
        }

        uint32 fee = IUniswapV2Viewer(uni2Viewer).fee(pool);

        if (fee % 1000 == 0) {
            uint256 amountInWithFee = amountIn.mul(1000 - fee / 1000);
            uint256 numerator = amountInWithFee.mul(reserveOutput);
            uint256 denominator = reserveInput.mul(1000).add(amountInWithFee);
            _output = numerator / denominator;
        } else {
            uint256 amountInWithFee = amountIn.mul(10000 - fee / 100);
            uint256 numerator = amountInWithFee.mul(reserveOutput);
            uint256 denominator = reserveInput.mul(10000).add(amountInWithFee);
            _output = numerator / denominator;
        }
    }

    function swapExactIn(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        address to
    ) external payable override returns (uint256 _output) {
        console.log("TrashUniV2Adapter.swapExactIn:");
        console.log("TrashUniV2Adapter.swapExactIn: fromToken = %s", fromToken);
        console.log("TrashUniV2Adapter.swapExactIn: toToken = %s", toToken);
        console.log("TrashUniV2Adapter.swapExactIn: pool = %s", pool);
        console.log("TrashUniV2Adapter.swapExactIn: to = %s", to);

        // if meshswap
        if (this.factory(pool) == MeshFactory) {
            console.log("TrashUniV2Adapter: Meshswap:");
            address[] memory path = new address[](2);
            IERC20(fromToken).universalApproveMax(MeshRouter, amountIn);
            console.log(
                "TrashUniV2Adapter: Meshswap: allowance %d",
                IERC20(fromToken).allowance(address(this), MeshRouter)
            );

            path[0] = fromToken;
            path[1] = toToken;
            uint256[] memory amounts = IMeshswapRouter(MeshRouter).swapExactTokensForTokens(
                amountIn,
                1,
                path,
                to,
                type(uint256).max
            );
            _output = amounts[amounts.length - 1];
            console.log("TrashUniV2Adapter.swapExactIn: _output = %d", _output);
        } else {
            revert("TrashUniV2Adapter.swapExactIn: invalid trash pool");
        }
    }
}
