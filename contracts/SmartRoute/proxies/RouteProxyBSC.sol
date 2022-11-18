// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { IApproveProxy } from "../ApproveProxy.sol";
import { IERC20 } from "../../intf/IERC20.sol";
import { IWETH } from "../../intf/IWETH.sol";
import { SafeMath } from "../../lib/SafeMath.sol";
import { ReentrancyGuard } from "../../lib/ReentrancyGuard.sol";
import { SafeCast } from "../../lib/SafeCast.sol";
import { Withdrawable } from "../../lib/Withdrawable.sol";
import { UniERC20 } from "../../lib/UniERC20.sol";
import { SafeERC20 } from "../../lib/SafeERC20.sol";
import { MultiAMMLib } from "../../lib/MultiAMMLib.sol";
import { IRouterAdapter } from "../intf/IRouterAdapter.sol";

import { IFlashLoanReceiverV2 } from "../intf/IFlashLoanReceiverV2.sol";
import { ILendingPoolAddressesProviderV2 } from "../intf/ILendingPoolAddressesProviderV2.sol";
import { ILendingPoolV2 } from "../intf/ILendingPoolV2.sol";
import { IChainlink } from "../intf/IChainlink.sol";
import { IPool } from "../intf/IPool.sol";

import "hardhat/console.sol";

/**
 * @title RouteProxy
 * @author fortoon21
 *
 * @notice Split trading
 * Need to wrap eth address in the following pool convention
 */
contract RouteProxyBSC is IFlashLoanReceiverV2, Withdrawable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeCast for int256;
    using UniERC20 for IERC20;
    using SafeERC20 for IERC20;

    receive() external payable {}

    // ============ Storage ============

    // uint256 constant _DEFAULT_WO_FEE_ = 999000; // 0.1% trading fee from output
    uint256 constant _DEFAULT_WO_FEE_ = 1000000; //TODO (_calcMultiHopSingleSwap에서 fee포함해서 계산하기)
    uint256 constant _FEE_DENOMINATOR_ = 1000000;
    address constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address payable public immutable _WETH_ADDRESS_;
    address public immutable _APPROVE_PROXY_;
    // flashloan address provider
    address public immutable _ADDRESS_PROVIDER_;
    address public immutable _LENDING_POOL_;
    mapping(address => address) public oracleRegistry;
    // polygon: btc, eth, matic, usdt, dai, usdc,             aave, link
    // bsc: btc, eth, bnb,       udst,      usdc, busd, tusd, aave, link

    // ============ Events ============

    event OrderHistory(
        address fromToken,
        address toToken,
        address sender,
        uint256 fromAmount,
        uint256 returnAmount,
        uint256 deductedFee
    );

    // ============ Modifiers ============

    modifier checkDeadline(uint256 deadLine) {
        require(deadLine >= block.timestamp, "RouteProxy: EXPIRED");
        _;
    }

    // struct for saving the number of variables
    struct FlashLoanDescriptions {
        uint256[] uniqueAssetIdxes;
        uint256[] assetValues;
        uint256 nativePrice;
        address[] assets;
        address[] uniqueAssets;
        uint16 flag;
        uint256 uniqueNum;
    }
    struct FlashLoanParams {
        address[] assets;
        uint256[] amounts;
        uint256[] modes;
    }

    constructor(
        address approveProxy,
        address _defaultFlashloan,
        address payable __WETH_ADDRESS_,
        address[] memory baseTokens,
        address[] memory feedSources
    ) {
        _APPROVE_PROXY_ = approveProxy;
        _ADDRESS_PROVIDER_ = _defaultFlashloan;
        _WETH_ADDRESS_ = __WETH_ADDRESS_;
        _LENDING_POOL_ = ILendingPoolAddressesProviderV2(_ADDRESS_PROVIDER_).getLendingPool();
        require(baseTokens.length == feedSources.length, "base feed length diff");
        for (uint256 i; i < baseTokens.length; i++) {
            oracleRegistry[baseTokens[i]] = feedSources[i];
        }
    }

    /**
     * @dev This function executes sequential swaps without spliting input amount (100%)
     *
     * A 100% [ UNI2 ] B [ CURVE] C
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param pathInfos Sequential swaps information
     * @param minReturnAmount minimum return amount
     * @param deadLine blocktime limit
     */
    function multiHopSingleSwap(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.Swap[] calldata pathInfos,
        uint256 minReturnAmount,
        uint256 deadLine,
        uint16[2] calldata isWETH
    ) public payable checkDeadline(deadLine) nonReentrant returns (uint256[] memory outputs) {
        // debug
        // console.log("RouteProxy.multiHopSingleSwap: ");
        require(minReturnAmount > 0, "minReturn should be larger than 0");
        require(
            pathInfos[0].fromToken == fromToken &&
                pathInfos[0].amountIn == amountIn &&
                pathInfos[pathInfos.length - 1].toToken == toToken,
            "not same input"
        );

        // console.log("RouteProxy.multiHopSingleSwap: _deposit");
        _deposit(msg.sender, isWETH[0] == 1 ? _WETH_ADDRESS_ : fromToken, amountIn);

        // weth came to routeproxy at first so unwrap weth to eth
        if (isWETH[0] == 1) {
            require(fromToken == _ETH_ADDRESS_, "Not valid fromToken");
            IWETH(_WETH_ADDRESS_).withdraw(amountIn);
        }

        // console.log("RouteProxy.multiHopSingleSwap: _multiHopSingleSwap");
        outputs = _multiHopSingleSwap(pathInfos);
        uint256 realOutput = outputs[outputs.length - 1].mul(_DEFAULT_WO_FEE_).div(_FEE_DENOMINATOR_);
        require(realOutput >= minReturnAmount, "out of slippage");

        if (isWETH[1] == 1) {
            require(toToken == _ETH_ADDRESS_, "Not valid toToken");
            IWETH(_WETH_ADDRESS_).deposit{ value: realOutput }();
            IERC20(_WETH_ADDRESS_).safeTransfer(pathInfos[pathInfos.length - 1].to, realOutput);
        } else {
            IERC20(toToken).uniTransfer(pathInfos[pathInfos.length - 1].to, realOutput);
        }

        emit OrderHistory(
            fromToken,
            toToken,
            msg.sender,
            amountIn,
            realOutput,
            outputs[outputs.length - 1] - realOutput
        );
    }

    /**
     * @dev This function estimates sequential swaps without spliting input amount (100%)
     *
     * A 100% [ UNI2 ] B [ CURVE] C
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param pathInfos Sequential swaps information
     */
    function getMultiHopSingleSwapOut(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.Swap[] calldata pathInfos
    ) public returns (uint256[] memory outputs) {
        require(
            pathInfos[0].fromToken == fromToken &&
                pathInfos[0].amountIn == amountIn &&
                pathInfos[pathInfos.length - 1].toToken == toToken,
            "not same input"
        );

        outputs = _calcMultiHopSingleSwap(pathInfos);
    }

    /**
     * @dev This function executes the single swap with multiple pool paths which have the same input token and output token by spliting input amount
     *
     * A 50% [ UNI2 ] B
     *   30% [ CURVE]
     *   20% [ UNI3 ]
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param weightPathInfo spliting input amount to multiple pools swap information
     * @param minReturnAmount minimum return amount
     * @param deadLine blocktime limit
     */
    function singleHopMultiSwap(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.WeightedSwap calldata weightPathInfo,
        uint256 minReturnAmount,
        uint256 deadLine,
        uint16[2] calldata isWETH
    ) public payable checkDeadline(deadLine) nonReentrant returns (uint256 output) {
        // debug
        require(minReturnAmount > 0, "minReturn should be larger than 0");

        require(
            weightPathInfo.fromToken == fromToken &&
                weightPathInfo.amountIn == amountIn &&
                weightPathInfo.toToken == toToken,
            "not same input"
        );
        _deposit(msg.sender, isWETH[0] == 1 ? _WETH_ADDRESS_ : fromToken, amountIn);

        // weth came to routeproxy at first so unwrap weth to eth
        if (isWETH[0] == 1) {
            require(fromToken == _ETH_ADDRESS_, "Not valid fromToken");
            IWETH(_WETH_ADDRESS_).withdraw(amountIn);
        }
        output = _singleHopMultiSwap(weightPathInfo);

        uint256 realOutput = output.mul(_DEFAULT_WO_FEE_).div(_FEE_DENOMINATOR_);
        require(realOutput >= minReturnAmount, "out of slippage");

        if (isWETH[1] == 1) {
            require(toToken == _ETH_ADDRESS_, "Not valid toToken");
            IWETH(_WETH_ADDRESS_).deposit{ value: realOutput }();
            IERC20(_WETH_ADDRESS_).safeTransfer(weightPathInfo.to, realOutput);
        } else {
            IERC20(toToken).uniTransfer(weightPathInfo.to, realOutput);
        }

        emit OrderHistory(fromToken, toToken, msg.sender, amountIn, realOutput, output - realOutput);
    }

    /**
     * @dev This function executes the single swap with multiple pool paths which have the same input token and output token by spliting input amount
     *
     * A 50% [ UNI2 ] B
     *   30% [ CURVE]
     *   20% [ UNI3 ]
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param weightPathInfo spliting input amount to multiple pools swap information
     */
    function getSingleHopMultiSwapOut(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.WeightedSwap calldata weightPathInfo
    ) public returns (uint256 output) {
        require(
            weightPathInfo.fromToken == fromToken &&
                weightPathInfo.amountIn == amountIn &&
                weightPathInfo.toToken == toToken,
            "not same input"
        );
        output = _calcSingleHopMultiSwap(weightPathInfo);
    }

    /**
     * @dev This function executes sequential single hop swaps which consists of multiple pool paths which have the same input token and output token by spliting input amount
     *
     * A 50% [ UNI3 ] B 60% [ CURVE] C
     *   50% [ UNI2 ]   40% [ UNI3 ]
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param weightPathInfos sequential spliting input amount to multiple pools swap information
     * @param minReturnAmount minimum return amount
     * @param deadLine blocktime limit
     */
    function multiHopMultiSwap(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.WeightedSwap[] calldata weightPathInfos,
        uint256 minReturnAmount,
        uint256 deadLine,
        uint16[2] calldata isWETH
    ) public payable checkDeadline(deadLine) nonReentrant returns (uint256[] memory outputs) {
        // debug
        require(minReturnAmount > 0, "minReturn should be larger than 0");

        require(
            weightPathInfos[0].fromToken == fromToken &&
                weightPathInfos[0].amountIn == amountIn &&
                weightPathInfos[weightPathInfos.length - 1].toToken == toToken,
            "not same input"
        );
        _deposit(msg.sender, isWETH[0] == 1 ? _WETH_ADDRESS_ : fromToken, amountIn);

        // weth came to routeproxy at first so unwrap weth to eth
        if (isWETH[0] == 1) {
            require(fromToken == _ETH_ADDRESS_, "Not valid fromToken");
            IWETH(_WETH_ADDRESS_).withdraw(amountIn);
        }
        outputs = _multiHopMultiSwap(weightPathInfos);
        uint256 realOutput = outputs[outputs.length - 1].mul(_DEFAULT_WO_FEE_).div(_FEE_DENOMINATOR_);

        require(realOutput >= minReturnAmount, "out of slippage");
        if (isWETH[1] == 1) {
            require(toToken == _ETH_ADDRESS_, "Not valid toToken");
            IWETH(_WETH_ADDRESS_).deposit{ value: realOutput }();
            IERC20(_WETH_ADDRESS_).safeTransfer(weightPathInfos[weightPathInfos.length - 1].to, realOutput);
        } else {
            IERC20(toToken).uniTransfer(weightPathInfos[weightPathInfos.length - 1].to, realOutput);
        }

        emit OrderHistory(
            fromToken,
            toToken,
            msg.sender,
            amountIn,
            realOutput,
            outputs[outputs.length - 1] - realOutput
        );
    }

    /**
     * @dev This function executes sequential single hop swaps which consists of multiple pool paths which have the same input token and output token by spliting input amount
     *
     * A 50% [ UNI3 ] B 60% [ CURVE] C
     *   50% [ UNI2 ]   40% [ UNI3 ]
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address

     */
    function getMultiHopMultiSwapOut(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.WeightedSwap[] calldata weightPathInfos
    ) public returns (uint256[] memory outputs) {
        require(
            weightPathInfos[0].fromToken == fromToken &&
                weightPathInfos[0].amountIn == amountIn &&
                weightPathInfos[weightPathInfos.length - 1].toToken == toToken,
            "not same input"
        );
        outputs = _calcMultiHopMultiSwap(weightPathInfos);
    }

    /**
     * @dev This function executes the multihop swap with multiple pool paths by spliting input amount it has no limit to compose any swaps
     *
     * A 60% [ UNI3 ] B 60% [ CURVE] C
     *                  30% [ UNI3 ]
     *                  10% [ UNI2 ]
     *   40% [         UNI2        ]
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param linearWeightPathInfo linearly spliting input amount to multiple pools swap information with full composability
     * @param minReturnAmount minimum return amount
     * @param deadLine blocktime limit
     */
    function linearSplitMultiHopMultiSwap(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.LinearWeightedSwap calldata linearWeightPathInfo,
        uint256 minReturnAmount,
        uint256 deadLine,
        uint16[2] calldata isWETH
    ) public payable checkDeadline(deadLine) nonReentrant returns (uint256 output) {
        require(minReturnAmount > 0, "minReturn should be larger than 0");

        require(
            linearWeightPathInfo.amountIn == amountIn &&
                linearWeightPathInfo.fromToken == fromToken &&
                linearWeightPathInfo.toToken == toToken,
            "not same input"
        );
        _deposit(msg.sender, isWETH[0] == 1 ? _WETH_ADDRESS_ : fromToken, amountIn);
        // weth came to routeproxy at first so unwrap weth to eth
        if (isWETH[0] == 1) {
            require(fromToken == _ETH_ADDRESS_, "Not valid fromToken");
            IWETH(_WETH_ADDRESS_).withdraw(amountIn);
        }
        output = _linearSplitMultiHopMultiSwap(linearWeightPathInfo);

        uint256 realOutput = output.mul(_DEFAULT_WO_FEE_).div(_FEE_DENOMINATOR_);
        require(realOutput >= minReturnAmount, "out of slippage");

        if (isWETH[1] == 1) {
            require(toToken == _ETH_ADDRESS_, "Not valid toToken");
            IWETH(_WETH_ADDRESS_).deposit{ value: realOutput }();
            IERC20(_WETH_ADDRESS_).safeTransfer(linearWeightPathInfo.to, realOutput);
        } else {
            IERC20(toToken).uniTransfer(linearWeightPathInfo.to, realOutput);
        }
        emit OrderHistory(fromToken, toToken, msg.sender, amountIn, realOutput, output - realOutput);
    }

    /**
     * @dev This function executes the multihop swap with multiple pool paths by spliting input amount it has no limit to compose any swaps
     *
     * A 60% [ UNI3 ] B 60% [ CURVE] C
     *                  30% [ UNI3 ]
     *                  10% [ UNI2 ]
     *   40% [         UNI2        ]
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param linearWeightPathInfo linearly spliting input amount to multiple pools swap information with full composability
     */
    function getLinearSplitMultiHopMultiSwapOut(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.LinearWeightedSwap calldata linearWeightPathInfo
    ) public returns (uint256 output) {
        require(
            linearWeightPathInfo.amountIn == amountIn &&
                linearWeightPathInfo.fromToken == fromToken &&
                linearWeightPathInfo.toToken == toToken,
            "not same input"
        );
        output = _calcLinearSplitMultiHopMultiSwap(linearWeightPathInfo);
    }

    /**
     * @dev This function executes linearSplitMultiHopMultiSwap and calculate the cyclic arbitrage paths to decide whether it executes arbitrage logic using flashloan. By doing so, traders can minimize slippage and protect themselves by MEV attack
     *
     * A 60% [ UNI3 ] B 60% [ CURVE] C
     *                  30% [ UNI3 ]
     *                  10% [ UNI2 ]
     *   40% [         UNI2        ]
     *
     * calculate cyclic arbitrage (arbitrage candidate paths are calculated from off-chain)
     * $ 100% [ 1? ] C [ 2? ] A [ 3? ] $
     * if these cycle profits are larger than each flashloan premium, (== new_balance($) >= old_balance($) * (1+premium))
     * executes flashloans and transfer the profits to trader
     *
     * @param fromToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param amountIn input amount of fromToken
     * @param toToken for WETH, ETH, address(eee...), for ERC20, its own address
     * @param linearWeightPathInfo linearly spliting input amount to multiple pools swap information with full composability
     * @param flashDes flashloan descriptions
     * @param minReturnAmount minimum return amount
     * @param deadLine blocktime limit
     */
    function shieldSwap(
        address fromToken,
        uint256 amountIn,
        address toToken,
        MultiAMMLib.LinearWeightedSwap memory linearWeightPathInfo,
        MultiAMMLib.FlashLoanDes[] memory flashDes,
        uint256 minReturnAmount,
        uint256 deadLine,
        uint16[2] calldata isWETH
    ) external payable checkDeadline(deadLine) nonReentrant returns (uint256 output) {
        require(minReturnAmount > 0, "minReturn should be larger than 0");
        require(
            linearWeightPathInfo.amountIn == amountIn &&
                linearWeightPathInfo.fromToken == fromToken &&
                linearWeightPathInfo.toToken == toToken,
            "not same input"
        );
        _deposit(msg.sender, isWETH[0] == 1 ? _WETH_ADDRESS_ : fromToken, amountIn);
        // weth came to routeproxy at first so unwrap weth to eth
        if (isWETH[0] == 1) {
            require(fromToken == _ETH_ADDRESS_, "Not valid fromToken");
            IWETH(_WETH_ADDRESS_).withdraw(amountIn);
        }
        output = _linearSplitMultiHopMultiSwap(linearWeightPathInfo);

        // TODO for now there's no fee
        // uint256 realOutput = output.mul(_DEFAULT_WO_FEE_).div(_FEE_DENOMINATOR_);
        // require(realOutput >= minReturnAmount, "out of slippage");
        require(output >= minReturnAmount, "out of slippage");

        if (isWETH[1] == 1) {
            require(toToken == _ETH_ADDRESS_, "Not valid toToken");
            // IWETH(_WETH_ADDRESS_).deposit{ value: realOutput }();
            // IERC20(_WETH_ADDRESS_).safeTransfer(linearWeightPathInfo.to, realOutput);
            IWETH(_WETH_ADDRESS_).deposit{ value: output }();
            IERC20(_WETH_ADDRESS_).safeTransfer(linearWeightPathInfo.to, output);
        } else {
            // IERC20(toToken).uniTransfer(linearWeightPathInfo.to, realOutput);
            IERC20(toToken).uniTransfer(linearWeightPathInfo.to, output);
        }

        // we should execute multihopsingleswap array only to prevent errors from overusing the same pool before updating states
        // TODO how to deal with gas fee(in each trade? or bulk trade)
        // For simplicity, use the average of the gas price
        if (flashDes.length > 0) {
            FlashLoanDescriptions memory fd; // struct for saving the number of variables
            fd.assets = new address[](flashDes.length);
            fd.uniqueAssets = new address[](flashDes.length);
            fd.uniqueAssetIdxes = new uint256[](flashDes.length);

            for (uint256 i; i < flashDes.length; i++) {
                fd.assets[i] = flashDes[i].asset == _ETH_ADDRESS_ ? _WETH_ADDRESS_ : flashDes[i].asset;
                fd.flag = 1;

                for (uint256 j; j < fd.uniqueNum; j++) {
                    if (fd.uniqueAssets[j] == fd.assets[i]) {
                        fd.flag = 0;
                        break;
                    }
                }

                if (fd.flag == 1) {
                    fd.uniqueAssetIdxes[i] = fd.uniqueNum;
                    fd.uniqueAssets[fd.uniqueNum] = fd.assets[i];
                    fd.uniqueNum += 1;
                }
            }

            fd.assetValues = new uint256[](fd.uniqueNum);
            for (uint256 j; j < fd.uniqueNum; j++) {
                (, int256 tmp, , , ) = IChainlink(oracleRegistry[fd.uniqueAssets[j]]).latestRoundData();
                fd.assetValues[j] = tmp.toUint256();
            }
            {
                (, int256 tmp, , , ) = IChainlink(oracleRegistry[_WETH_ADDRESS_]).latestRoundData();
                fd.nativePrice = tmp.toUint256();
            }

            // realOutput = executeFlashloanV2(flashDes, fd, realOutput, toToken);
            output = executeFlashloanV2(flashDes, fd, output, toToken);
        }

        // emit OrderHistory(fromToken, toToken, msg.sender, amountIn, realOutput, output - realOutput);
        emit OrderHistory(fromToken, toToken, msg.sender, amountIn, output, 0);
    }

    function executeFlashloanV2(
        MultiAMMLib.FlashLoanDes[] memory flashDes,
        FlashLoanDescriptions memory fd,
        uint256 realOutput,
        address toToken
    ) internal returns (uint256) {
        for (uint256 i; i < flashDes.length; i++) {
            flashDes[i].swaps[0].amountIn = flashDes[i].amountIn; // temporary
            require(flashDes[i].swaps[0].amountIn == flashDes[i].amountIn, "flashloan amountIn not match");
            require(
                flashDes[i].swaps[0].fromToken == flashDes[i].asset &&
                    flashDes[i].asset == flashDes[i].swaps[flashDes[i].swaps.length - 1].toToken,
                "flashloan from to assets not match"
            );
            uint256[] memory outputs = _calcMultiHopSingleSwap(flashDes[i].swaps);
            uint256 cmpOutput = flashDes[i]
                .amountIn
                .mul(10000 + ILendingPoolV2(_LENDING_POOL_).FLASHLOAN_PREMIUM_TOTAL())
                .div(10000);
            uint256 assetPrice = fd.assetValues[fd.uniqueAssetIdxes[i]];
            if (
                outputs[outputs.length - 1].mul(assetPrice) >
                cmpOutput.mul(assetPrice).add(flashDes[i].estimatedGas.mul(fd.nativePrice).mul(tx.gasprice))
            ) {
                uint256 delta = IERC20(flashDes[i].asset).uniBalanceOf(address(this));

                FlashLoanParams memory fp;
                fp.assets = new address[](1);
                fp.amounts = new uint256[](1);
                fp.modes = new uint256[](1);

                fp.assets[0] = flashDes[i].asset;
                fp.amounts[0] = flashDes[i].amountIn;
                fp.modes[0] = 0;

                ILendingPoolV2(_LENDING_POOL_).flashLoan(
                    address(this),
                    fp.assets,
                    fp.amounts,
                    fp.modes,
                    address(this),
                    abi.encode(flashDes[i].swaps),
                    0
                );
                delta = IERC20(flashDes[i].asset).uniBalanceOf(address(this)) - delta;
                delta = delta.mul(_DEFAULT_WO_FEE_).div(_FEE_DENOMINATOR_);
                if (toToken == flashDes[i].asset) {
                    realOutput += delta;
                }
                if (flashDes[i].asset == _WETH_ADDRESS_) {
                    IWETH(_WETH_ADDRESS_).withdraw(delta);
                    (bool sent, ) = msg.sender.call{ value: delta }("");
                    require(sent, "Failed_To_Transfer_ETH");
                } else {
                    IERC20(flashDes[i].asset).safeTransfer(msg.sender, delta);
                }
            }
        }
        return realOutput;
    }

    /**
     * @notice Executes an operation after receiving the flash-borrowed asset
     * @dev Ensure that the contract can return the debt + premium, e.g., has
     *      enough funds to repay and has approved the Pool to pull the total amount
     * @param asset The address of the flash-borrowed asset
     * @param amount The amount of the flash-borrowed asset
     * @param premium The fee of the flash-borrowed asset
     * @param initiator The address of the flashloan initiator
     * @param params The byte-encoded params passed when initiating the flashloan
     * @return True if the execution of the operation succeeds, false otherwise
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //
        require(msg.sender == _LENDING_POOL_, "Not from LendingPool");
        require(address(this) == initiator, "initiator is not RouteProxy");

        MultiAMMLib.Swap[] memory pathInfos = abi.decode(params, (MultiAMMLib.Swap[]));
        pathInfos[pathInfos.length - 1].to = address(this);
        _multiHopSingleSwap(pathInfos);

        // At the end of your logic above, this contract owes
        // the flashloaned amount + fee.
        // Therefore ensure your contract has enough to repay
        // these amounts.
        IERC20(asset).safeTransfer(_LENDING_POOL_, amount + premium);
        return true;
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //
        require(msg.sender == _LENDING_POOL_, "Not from LendingPool");
        require(address(this) == initiator, "initiator is not RouteProxy");

        MultiAMMLib.Swap[] memory pathInfos = abi.decode(params, (MultiAMMLib.Swap[]));
        pathInfos[pathInfos.length - 1].to = address(this);
        _multiHopSingleSwap(pathInfos);

        // At the end of your logic above, this contract owes
        // the flashloaned amount + fee.
        // Therefore ensure your contract has enough to repay
        // these amounts.
        IERC20(assets[0]).safeTransfer(_LENDING_POOL_, amounts[0] + premiums[0]);
        return true;
    }

    function _deposit(
        address from,
        address token,
        uint256 amount
    ) internal {
        if (token == _ETH_ADDRESS_) {
            require(msg.value == amount, "ETH_VALUE_WRONG");
        } else {
            IApproveProxy(_APPROVE_PROXY_).claimTokens(token, from, address(this), amount);
        }
    }

    function _executeSwap(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address adapter,
        address pool,
        uint16 poolEdition
    ) internal returns (uint256 output) {
        // only ETH comes as from not WETH
        // ETH -> WETH address (wrapping)
        address from = fromToken;
        address to = toToken;

        console.log("fromToken: %s", fromToken);
        console.log("toToken: %s", toToken);
        console.log("pool: %s", pool);
        console.log("adapter: %s", adapter);
        console.log("poolEdition: %d", poolEdition);

        // poolEdition is 0 only for uniV2
        if (poolEdition == 0) {
            if (fromToken == _ETH_ADDRESS_) {
                IWETH(_WETH_ADDRESS_).deposit{ value: amountIn }();
                from = _WETH_ADDRESS_;
            }
            if (toToken == _ETH_ADDRESS_) {
                to = _WETH_ADDRESS_;
            }

            IERC20(from).safeTransfer(pool, amountIn);
        } else if (poolEdition == 1) {
            // poolEdition is 1 for TrashUniV2Adapter, CurveAdapter
            IERC20(fromToken).uniTransfer(adapter, amountIn);
        } else if (poolEdition == 2) {
            if (fromToken == _ETH_ADDRESS_) {
                IWETH(_WETH_ADDRESS_).deposit{ value: amountIn }();
                from = _WETH_ADDRESS_;
            }
            if (toToken == _ETH_ADDRESS_) {
                to = _WETH_ADDRESS_;
            }
            IERC20(from).uniTransfer(adapter, amountIn);
        } else {
            revert("Invalid poolEdition");
        }

        output = IRouterAdapter(adapter).swapExactIn(from, amountIn, to, pool, address(this));

        // unwrap weth to eth
        if (toToken == _ETH_ADDRESS_ && (poolEdition == 0 || poolEdition == 2)) {
            IWETH(_WETH_ADDRESS_).withdraw(output);
        }
    }

    //TODO //@TODO //!TODO: (임시 patch) eth를 weth로 자동으로 컨버팅 하지 않고, 분리해서 처리해야하지만 임시로 univ2일때만 (poolEdition=0 을 체크하는 꼼수를 사용해둔 상태) 자동 converting이 되도록 처리했음
    function _checkConvertToWETH(address fromToken, uint16 poolEdition) internal view returns (address) {
        return fromToken == _ETH_ADDRESS_ && (poolEdition == 0 || poolEdition == 2) ? _WETH_ADDRESS_ : fromToken;
    }

    function _calcMultiHopSingleSwap(MultiAMMLib.Swap[] memory pathInfos) internal returns (uint256[] memory outputs) {
        uint256 pathInfoNum = pathInfos.length;
        outputs = new uint256[](pathInfoNum + 1);
        outputs[0] = pathInfos[0].amountIn;

        for (uint256 i = 1; i < pathInfoNum; i++) {
            // define midtoken address, ETH -> WETH address
            require(pathInfos[i - 1].toToken == pathInfos[i].fromToken, "Not valid multihopSingleSwap Path");

            //TODO //@TODO //!TODO: (임시 patch) eth를 weth로 자동으로 컨버팅 하지 않고, 분리해서 처리해야하지만 임시로 univ2일때만 (poolEdition=0 을 체크하는 꼼수를 사용해둔 상태) 자동 converting이 되도록 처리했음
            outputs[i] = IRouterAdapter(pathInfos[i - 1].adapter).getAmountOut(
                _checkConvertToWETH(pathInfos[i - 1].fromToken, pathInfos[i - 1].poolEdition),
                outputs[i - 1],
                _checkConvertToWETH(pathInfos[i - 1].toToken, pathInfos[i - 1].poolEdition),
                pathInfos[i - 1].pool
            );
        }
        outputs[pathInfoNum] = IRouterAdapter(pathInfos[pathInfoNum - 1].adapter).getAmountOut(
            _checkConvertToWETH(pathInfos[pathInfoNum - 1].fromToken, pathInfos[pathInfoNum - 1].poolEdition),
            // pathInfos[pathInfoNum - 1].fromToken == _ETH_ADDRESS_
            //     ? _WETH_ADDRESS_
            //     : pathInfos[pathInfoNum - 1].fromToken,
            outputs[pathInfoNum - 1],
            _checkConvertToWETH(pathInfos[pathInfoNum - 1].toToken, pathInfos[pathInfoNum - 1].poolEdition),
            // pathInfos[pathInfoNum - 1].toToken == _ETH_ADDRESS_ ? _WETH_ADDRESS_ : pathInfos[pathInfoNum - 1].toToken,
            pathInfos[pathInfoNum - 1].pool
        );
    }

    function _calcSingleHopMultiSwap(MultiAMMLib.WeightedSwap memory weightPathInfo) internal returns (uint256 output) {
        require(
            weightPathInfo.weights.length == weightPathInfo.adapters.length &&
                weightPathInfo.weights.length == weightPathInfo.pools.length &&
                weightPathInfo.weights.length == weightPathInfo.poolEditions.length,
            "Invalid input length"
        );
        uint256 totalWeight;
        uint256 poolNum = weightPathInfo.weights.length;
        for (uint256 i; i < poolNum; i++) {
            totalWeight += weightPathInfo.weights[i];
        }

        uint256 rest = weightPathInfo.amountIn;
        for (uint256 i; i < poolNum; i++) {
            uint256 partAmountIn = i == poolNum - 1
                ? rest
                : weightPathInfo.amountIn.mul(weightPathInfo.weights[i]).div(totalWeight);
            rest = rest.sub(partAmountIn);

            output += IRouterAdapter(weightPathInfo.adapters[i]).getAmountOut(
                weightPathInfo.fromToken == _ETH_ADDRESS_ ? _WETH_ADDRESS_ : weightPathInfo.fromToken,
                partAmountIn,
                weightPathInfo.toToken == _ETH_ADDRESS_ ? _WETH_ADDRESS_ : weightPathInfo.toToken,
                weightPathInfo.pools[i]
            );
        }
    }

    function _calcMultiHopMultiSwap(MultiAMMLib.WeightedSwap[] memory weightPathInfos)
        internal
        returns (uint256[] memory outputs)
    {
        outputs = new uint256[](weightPathInfos.length + 1);
        outputs[0] = weightPathInfos[0].amountIn;
        for (uint256 i = 1; i < weightPathInfos.length; i++) {
            require(weightPathInfos[i - 1].toToken == weightPathInfos[i].fromToken, "Not valid multihop Path");

            outputs[i] = _calcSingleHopMultiSwap(weightPathInfos[i - 1]);
            weightPathInfos[i].amountIn = outputs[i];
        }
        outputs[outputs.length - 1] = _calcSingleHopMultiSwap(weightPathInfos[weightPathInfos.length - 1]);
    }

    function _calcLinearSplitMultiHopMultiSwap(MultiAMMLib.LinearWeightedSwap memory linearWeightPathInfo)
        internal
        returns (uint256 output)
    {
        require(
            linearWeightPathInfo.weights.length == linearWeightPathInfo.weightedSwaps.length,
            "Invalid input length"
        );
        uint256 totalWeight;
        uint256 splitNum = linearWeightPathInfo.weights.length;
        for (uint256 i; i < splitNum; i++) {
            totalWeight += linearWeightPathInfo.weights[i];
        }

        uint256 rest = linearWeightPathInfo.amountIn;
        for (uint256 i; i < splitNum; i++) {
            uint256 hopNum = linearWeightPathInfo.weightedSwaps[i].length;
            require(
                linearWeightPathInfo.weightedSwaps[i][hopNum - 1].toToken == linearWeightPathInfo.toToken,
                "Not valid linear toToken"
            );
            require(
                linearWeightPathInfo.weightedSwaps[i][0].fromToken == linearWeightPathInfo.fromToken,
                "Not valid linear fromToken"
            );
            uint256 partAmountIn = i == splitNum - 1
                ? rest
                : linearWeightPathInfo.amountIn.mul(linearWeightPathInfo.weights[i]).div(totalWeight);
            rest = rest.sub(partAmountIn);
            linearWeightPathInfo.weightedSwaps[i][0].amountIn = partAmountIn;
            uint256[] memory outputs = _calcMultiHopMultiSwap(linearWeightPathInfo.weightedSwaps[i]);
            output += outputs[outputs.length - 1];
        }
    }

    function _multiHopSingleSwap(MultiAMMLib.Swap[] memory pathInfos) internal returns (uint256[] memory outputs) {
        uint256 pathInfoNum = pathInfos.length;
        outputs = _calcMultiHopSingleSwap(pathInfos);

        for (uint256 i = 1; i < pathInfoNum; i++) {
            require(pathInfos[i - 1].toToken == pathInfos[i].fromToken, "Not valid multihop Path");

            _executeSwap(
                pathInfos[i - 1].fromToken,
                outputs[i - 1],
                pathInfos[i - 1].toToken,
                pathInfos[i - 1].adapter,
                pathInfos[i - 1].pool,
                pathInfos[i - 1].poolEdition
            );
        }

        _executeSwap(
            pathInfos[pathInfoNum - 1].fromToken,
            outputs[pathInfoNum - 1],
            pathInfos[pathInfoNum - 1].toToken,
            pathInfos[pathInfoNum - 1].adapter,
            pathInfos[pathInfoNum - 1].pool,
            pathInfos[pathInfoNum - 1].poolEdition
        );
    }

    function _singleHopMultiSwap(MultiAMMLib.WeightedSwap memory weightPathInfo) internal returns (uint256 output) {
        require(
            weightPathInfo.weights.length == weightPathInfo.adapters.length &&
                weightPathInfo.weights.length == weightPathInfo.pools.length &&
                weightPathInfo.weights.length == weightPathInfo.poolEditions.length,
            "Invalid input length"
        );

        uint256 totalWeight;
        uint256 poolNum = weightPathInfo.weights.length;
        for (uint256 i; i < poolNum; i++) {
            totalWeight += weightPathInfo.weights[i];
        }

        uint256 rest = weightPathInfo.amountIn;

        for (uint256 i; i < poolNum; i++) {
            uint256 partAmountIn = i == poolNum - 1
                ? rest
                : weightPathInfo.amountIn.mul(weightPathInfo.weights[i]).div(totalWeight);
            rest = rest.sub(partAmountIn);

            output += _executeSwap(
                weightPathInfo.fromToken,
                partAmountIn,
                weightPathInfo.toToken,
                weightPathInfo.adapters[i],
                weightPathInfo.pools[i],
                weightPathInfo.poolEditions[i]
            );
        }
    }

    function _multiHopMultiSwap(MultiAMMLib.WeightedSwap[] memory weightPathInfos)
        internal
        returns (uint256[] memory outputs)
    {
        outputs = new uint256[](weightPathInfos.length + 1);
        outputs[0] = weightPathInfos[0].amountIn;
        for (uint256 i = 1; i < weightPathInfos.length; i++) {
            require(weightPathInfos[i - 1].toToken == weightPathInfos[i].fromToken, "Not valid multihop Path");
            if (i != weightPathInfos.length - 1) {
                weightPathInfos[i].to = address(this);
            }
            outputs[i] = _singleHopMultiSwap(weightPathInfos[i - 1]);
            weightPathInfos[i].amountIn = outputs[i];
        }
        outputs[outputs.length - 1] = _singleHopMultiSwap(weightPathInfos[weightPathInfos.length - 1]);
    }

    function _linearSplitMultiHopMultiSwap(MultiAMMLib.LinearWeightedSwap memory linearWeightPathInfo)
        internal
        returns (uint256 output)
    {
        require(
            linearWeightPathInfo.weights.length == linearWeightPathInfo.weightedSwaps.length,
            "Invalid input length"
        );
        uint256 totalWeight;
        uint256 splitNum = linearWeightPathInfo.weights.length;
        for (uint256 i; i < splitNum; i++) {
            totalWeight += linearWeightPathInfo.weights[i];
        }

        uint256 rest = linearWeightPathInfo.amountIn;
        for (uint256 i; i < splitNum; i++) {
            uint256 hopNum = linearWeightPathInfo.weightedSwaps[i].length;
            require(
                linearWeightPathInfo.weightedSwaps[i][hopNum - 1].toToken == linearWeightPathInfo.toToken,
                "Not valid linear toToken"
            );
            require(
                linearWeightPathInfo.weightedSwaps[i][0].fromToken == linearWeightPathInfo.fromToken,
                "Not valid linear fromToken"
            );

            uint256 partAmountIn = i == splitNum - 1
                ? rest
                : linearWeightPathInfo.amountIn.mul(linearWeightPathInfo.weights[i]).div(totalWeight);
            rest = rest.sub(partAmountIn);
            linearWeightPathInfo.weightedSwaps[i][0].amountIn = partAmountIn;
            uint256[] memory outputs = _multiHopMultiSwap(linearWeightPathInfo.weightedSwaps[i]);
            output += outputs[outputs.length - 1];
        }
    }
}
