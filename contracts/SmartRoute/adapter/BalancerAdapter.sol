// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;
import { IRouterAdapter } from "../intf/IRouterAdapter.sol";
import { IBalancerVault, IBalancerPool, IBalancerRegistry } from "../intf/IBalancer.sol";
import { IERC20 } from "../../intf/IERC20.sol";
import { FixedPoint } from "../../lib/FixedPoint.sol";
import { UniERC20 } from "../../lib/UniERC20.sol";
import "hardhat/console.sol";

contract BalancerAdapter is IRouterAdapter {
    using UniERC20 for IERC20;
    address public constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public immutable _WETH_ADDRESS_;

    struct Param {
        address fromTokenForGetPoolTokenInfo;
        address toTokenForGetPoolTokenInfo;
        uint256 ethAmount;
        uint256 fromBalance;
        uint256 toBalance;
    }

    receive() external payable {}

    constructor(address __WETH_ADDRESS_) {
        _WETH_ADDRESS_ = __WETH_ADDRESS_;
    }

    function vault(address pool) public view returns (address) {
        return IBalancerPool(pool).getVault();
    }

    function getAmountOut(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool
    ) public override returns (uint256 _output) {
        console.log("BalancerAdapter.getAmountOut:");

        Param memory param;
        param.fromTokenForGetPoolTokenInfo = fromToken;
        param.toTokenForGetPoolTokenInfo = toToken;
        if (fromToken == _ETH_ADDRESS_) {
            param.fromTokenForGetPoolTokenInfo = _WETH_ADDRESS_;
        }
        if (toToken == _ETH_ADDRESS_) {
            param.toTokenForGetPoolTokenInfo = _WETH_ADDRESS_;
        }

        bytes32 poolId = IBalancerPool(pool).getPoolId();

        console.log("BalancerAdapter.getAmountOut: fromToken=%s", fromToken);
        console.log("BalancerAdapter.getAmountOut: toToken=%s", toToken);
        console.log("BalancerAdapter.getAmountOut: amountIn=%d", amountIn);

        console.log(
            "BalancerAdapter.getAmountOut: fromTokenForGetPoolTokenInfo=%s",
            param.fromTokenForGetPoolTokenInfo
        );
        console.log("BalancerAdapter.getAmountOut: toTokenForGetPoolTokenInfo=%s", param.toTokenForGetPoolTokenInfo);

        IBalancerVault _vault = IBalancerVault(IBalancerPool(pool).getVault());

        IBalancerPool.SwapRequest memory request;
        request.kind = IBalancerVault.SwapKind.GIVEN_IN;
        request.tokenIn = param.fromTokenForGetPoolTokenInfo;
        request.tokenOut = param.toTokenForGetPoolTokenInfo;
        request.amount = amountIn;
        request.poolId = poolId;

        (param.fromBalance, , , ) = _vault.getPoolTokenInfo(poolId, param.fromTokenForGetPoolTokenInfo);
        (param.toBalance, , , ) = _vault.getPoolTokenInfo(poolId, param.toTokenForGetPoolTokenInfo);

        _output = IBalancerPool(pool).onSwap(request, param.fromBalance, param.toBalance);
    }

    function swapExactIn(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        address to
    ) external payable override returns (uint256 _output) {
        console.log("BalancerAdapter.swapExactIn:");

        Param memory param;
        param.fromTokenForGetPoolTokenInfo = fromToken;
        param.toTokenForGetPoolTokenInfo = toToken;
        // if (fromToken == _ETH_ADDRESS_) {
        //     param.fromTokenForGetPoolTokenInfo = _WETH_ADDRESS_;
        //     param.ethAmount = amountIn;
        // }
        // if (toToken == _ETH_ADDRESS_) {
        //     param.toTokenForGetPoolTokenInfo = _WETH_ADDRESS_;
        //     param.ethAmount = 0;
        // }
        if (fromToken == _ETH_ADDRESS_) {
            param.fromTokenForGetPoolTokenInfo = address(0);
            param.ethAmount = amountIn;
        }
        if (toToken == _ETH_ADDRESS_) {
            param.toTokenForGetPoolTokenInfo = address(0);
            param.ethAmount = 0;
        }

        console.log("BalancerAdapter.swapExactIn: fromToken=%s", fromToken);
        console.log("BalancerAdapter.swapExactIn: toToken=%s", toToken);
        console.log("BalancerAdapter.swapExactIn: amountIn=%d", amountIn);

        console.log("BalancerAdapter.swapExactIn: fromTokenForGetPoolTokenInfo=%s", param.fromTokenForGetPoolTokenInfo);
        console.log("BalancerAdapter.swapExactIn: toTokenForGetPoolTokenInfo=%s", param.toTokenForGetPoolTokenInfo);

        IBalancerVault.SingleSwap memory singleswap;
        singleswap.poolId = IBalancerPool(pool).getPoolId();
        singleswap.kind = IBalancerVault.SwapKind.GIVEN_IN;
        singleswap.assetIn = param.fromTokenForGetPoolTokenInfo;
        singleswap.assetOut = param.toTokenForGetPoolTokenInfo;
        // singleswap.assetIn = fromToken;
        // singleswap.assetOut = toToken;
        singleswap.amount = amountIn;

        IBalancerVault.FundManagement memory fundManagement;
        fundManagement.sender = address(this);
        fundManagement.fromInternalBalance = false;
        fundManagement.recipient = payable(to);
        fundManagement.toInternalBalance = false;

        IERC20(fromToken).universalApproveMax(IBalancerPool(pool).getVault(), amountIn);

        console.log("BalancerAdapter.swapExactIn.swap: start");
        console.log(
            "BalancerAdapter.swapExactIn.swap: IBalancerPool(pool).getVault()=%s",
            IBalancerPool(pool).getVault()
        );
        console.log("BalancerAdapter.swapExactIn.swap: singleswap.poolId=");
        console.logBytes32(singleswap.poolId);
        console.log("BalancerAdapter.swapExactIn.swap: singleswap.kind=%d", uint256(singleswap.kind));
        console.log("BalancerAdapter.swapExactIn.swap: singleswap.assetIn=%s", singleswap.assetIn);
        console.log("BalancerAdapter.swapExactIn.swap: singleswap.assetOut=%s", singleswap.assetOut);
        console.log("BalancerAdapter.swapExactIn.swap: singleswap.amount=%d", singleswap.amount);

        console.log("BalancerAdapter.swapExactIn.swap: fundManagement.sender=%s", fundManagement.sender);
        console.log(
            "BalancerAdapter.swapExactIn.swap: fundManagement.fromInternalBalance=%s",
            fundManagement.fromInternalBalance
        );
        console.log("BalancerAdapter.swapExactIn.swap: fundManagement.recipient=%s", fundManagement.recipient);
        console.log(
            "BalancerAdapter.swapExactIn.swap: fundManagement.toInternalBalance=%s",
            fundManagement.toInternalBalance
        );

        _output = IBalancerVault(IBalancerPool(pool).getVault()).swap{ value: param.ethAmount }(
            singleswap,
            fundManagement,
            1,
            type(uint256).max
        );
        console.log("BalancerAdapter.swapExactIn.swap: done");
    }
}
