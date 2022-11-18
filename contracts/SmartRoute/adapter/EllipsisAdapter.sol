// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;
import "hardhat/console.sol";
import { IRouterAdapter } from "../intf/IRouterAdapter.sol";
import {
    ICurveProvider,
    ICurveRegistry,
    ICurveCryptoRegistry,
    ICurveFactoryRegistry,
    ICurveCryptoFactoryRegistry,
    ICurve,
    ICurveCrypto,
    BasePool2Coins,
    BasePool3Coins,
    BaseLendingPool2Coins,
    BaseLendingPool3Coins
} from "../intf/IEllipsis.sol";
import { IERC20 } from "../../intf/IERC20.sol";
import { SafeMath } from "../../lib/SafeMath.sol";
import { SafeCast } from "../../lib/SafeCast.sol";
import { UniERC20 } from "../../lib/UniERC20.sol";
import { SafeERC20 } from "../../lib/SafeERC20.sol";
import "hardhat/console.sol";

// In curve factory = registry
contract EllipsisAdapter is IRouterAdapter {
    using SafeMath for uint256;
    using SafeCast for uint256;
    using SafeCast for int256;
    using UniERC20 for IERC20;
    using SafeERC20 for IERC20;
    address public constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address public immutable _WETH_ADDRESS_;
    address public immutable registry;
    address public immutable cryptoRegistry;
    address public immutable cryptoFactoryRegistry;

    mapping(address => address[2]) public baseCoins;

    constructor(
        address __WETH_ADDRESS_,
        address _registry,
        address _cryptoRegistry,
        address _cryptoFactoryRegistry
    ) {
        _WETH_ADDRESS_ = __WETH_ADDRESS_;
        registry = _registry;
        cryptoRegistry = _cryptoRegistry;
        cryptoFactoryRegistry = _cryptoFactoryRegistry;
    }

    receive() external payable {}

    function _isMR(address _registry) internal view returns (bool) {
        return _registry == registry;
    }

    function _isCR(address _registry) internal view returns (bool) {
        return _registry == cryptoRegistry;
    }

    function _isCFR(address _registry) internal view returns (bool) {
        return _registry == cryptoFactoryRegistry;
    }

    function _numCoin(address _registry, address pool) internal view returns (uint256) {
        if (_isMR(_registry)) {
            return ICurveRegistry(_registry).get_n_coins(pool);
        } else if (_isCR(_registry)) {
            return ICurveCryptoRegistry(_registry).get_n_coins(pool);
        } else if (_isCFR(_registry)) {
            return ICurveCryptoFactoryRegistry(_registry).get_n_coins(pool);
        } else {
            revert("EllipsisAdapter._numCoin: invalid registry");
        }
    }

    function _coinIdx(
        address _registry,
        address pool,
        address coin,
        uint256 numCoin
    ) internal view returns (uint256) {
        console.log("EllipsisAdapter._coinIdx: _registry=%s", _registry);
        console.log("EllipsisAdapter._coinIdx: pool=%s", pool);
        console.log("EllipsisAdapter._coinIdx: coin=%s", coin);

        address[4] memory underlying;
        if (_isMR(_registry)) {
            underlying = ICurveRegistry(registry).get_underlying_coins(pool);
        } else if (_isCR(_registry)) {
            underlying = ICurveCryptoRegistry(cryptoRegistry).get_underlying_coins(pool);
        } else if (_isCFR(_registry)) {
            underlying = ICurveCryptoFactoryRegistry(cryptoFactoryRegistry).get_underlying_coins(pool);
        } else {
            revert("EllipsisAdapter._coinIdx: Not matched registry");
        }

        // uint256 numCoin;
        // if (_isMR(_registry)) {
        //     numCoin = ICurveRegistry(_registry).get_n_coins(pool);
        // } else if (_isCR(_registry)) {
        //     numCoin = ICurveCryptoRegistry(_registry).get_n_coins(pool);
        // } else if (_isCFR(_registry)) {
        //     numCoin = ICurveCryptoFactoryRegistry(_registry).get_n_coins(pool);
        // } else {
        //     revert("EllipsisAdapter._coinIdx: invalid registry");
        // }

        for (uint256 i; i < numCoin; i++) {
            if (underlying[i] == coin) {
                return i;
            }
        }
        revert("EllipsisAdapter._coinIdx: Not matched coin index");
    }

    function _isLending(address pool) internal view returns (bool) {
        try ICurve(pool).wrapped_coins(0) {
            return true;
        } catch {
            return false;
        }
    }

    /* ========================================================
     * original code (getAmountOut, swapExactIn)
     * ======================================================== */
    function get_coin_index(
        address pool,
        uint256 n_coin,
        address coin
    ) internal view returns (uint256 i) {
        console.log("EllipsisAdapter.get_coin_index: pool=%s", pool);
        console.log("EllipsisAdapter.get_coin_index: n_coin=%d", n_coin);
        console.log("EllipsisAdapter.get_coin_index: coin=%s", coin);
        try ICurveRegistry(registry).get_underlying_coins(pool) returns (address[4] memory coins) {
            console.log("EllipsisAdapter.get_coin_index: get_underlying_coins");
            for (i = 0; i < n_coin; i++) {
                console.log("EllipsisAdapter.get_coin_index: coins[%d]=%s", i, coins[i]);
                if (coin == coins[i]) {
                    break;
                }
            }
            if (i == n_coin) {
                revert("Ellipsis: Invalid token");
            }
        } catch {
            console.log("EllipsisAdapter.get_coin_index: get_coins");
            address[4] memory coins = ICurveRegistry(registry).get_coins(pool);
            for (i = 0; i < n_coin; i++) {
                console.log("EllipsisAdapter.get_coin_index: coins[%d]=%s", i, coins[i]);
                if (coin == coins[i]) {
                    break;
                }
            }
            if (i == n_coin) {
                revert("Ellipsis: Invalid token");
            }
        }
    }

    /* ========================================================
     * new code (getAmountOut, swapExactIn)
     * ======================================================== */
    // _swapExactInCurve:
    //   kind:
    //     0: fromToken != LpToken && toToken != LpToken
    //     1: fromToken == LpToken
    //     2: toToken == LpTokens
    function _swapExactInCurve(
        address _registry,
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        uint16 kind
    ) internal {
        console.log("EllipsisAdapter._swapExactInCurve:");
        console.log("EllipsisAdapter._swapExactInCurve: kind=%d", kind);
        require(amountIn > 0, "Curve: INSUFFICIENT_INPUT_AMOUNT");
        // fromTokenForGetCoinIndices, toTokenForGetCoinIndices:
        // get_coins_indices issue: pool이 (native, token) pair여도 get_coins_indices에서 (wnative, token)을 넣어야만 동작함
        // 따라서, native이면 wnative로 바꿔줌
        // address fromTokenForGetCoinIndices = fromToken;
        // address toTokenForGetCoinIndices = toToken;
        uint256 ethAmount;
        bool use_eth;
        if (fromToken == _ETH_ADDRESS_) {
            // fromTokenForGetCoinIndices = _WETH_ADDRESS_;
            ethAmount = amountIn;
            use_eth = true;
        }
        if (toToken == _ETH_ADDRESS_) {
            // toTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }

        if (kind == 0) {
            // curve registry
            (int128 i, int128 j, bool isUnder) = ICurveRegistry(_registry).get_coin_indices(pool, fromToken, toToken);

            if (isUnder) {
                ICurve(pool).exchange_underlying{ value: ethAmount }(i, j, amountIn, 1);
            } else {
                ICurve(pool).exchange{ value: ethAmount }(i, j, amountIn, 1);
            }
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            bool isLending = _isLending(pool);
            int128 i = _coinIdx(_registry, pool, toToken, numCoin).toInt256().toInt128();

            console.log("CurveAdapter._swapExactInCurve: numCoin=%d", numCoin);
            console.log("CurveAdapter._swapExactInCurve: isLending=%d", isLending);
            if (numCoin == 2) {
                if (isLending) {
                    BaseLendingPool2Coins(pool).remove_liquidity_one_coin(amountIn, i, 1, true);
                } else {
                    BasePool2Coins(pool).remove_liquidity_one_coin(amountIn, i, 1);
                }
            } else if (numCoin == 3) {
                if (isLending) {
                    BaseLendingPool3Coins(pool).remove_liquidity_one_coin(amountIn, i, 1, true);
                } else {
                    BasePool3Coins(pool).remove_liquidity_one_coin(amountIn, i, 1);
                }
            }
        } else if (kind == 2) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(_registry, pool, fromToken, numCoin);
            if (numCoin == 2) {
                uint256[2] memory amounts;
                amounts[i] = amountIn;
                BasePool2Coins(pool).add_liquidity(amounts, 1);
            } else if (numCoin == 3) {
                uint256[3] memory amounts;
                amounts[i] = amountIn;
                BasePool3Coins(pool).add_liquidity(amounts, 1);
            }
        }
    }

    /* ========================================================
     * new code (getAmountOut, swapExactIn)
     * ======================================================== */
    // _swapExactInCryptoCurve:
    //   kind:
    //     0: fromToken != LpToken && toToken != LpToken
    //     1: fromToken == LpToken
    //     2: toToken == LpTokens
    function _swapExactInCryptoCurve(
        address _registry,
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        uint16 kind
    ) internal {
        console.log("EllipsisAdapter._swapExactInCryptoCurve:");
        console.log("EllipsisAdapter._swapExactInCryptoCurve: kind=%d", kind);
        require(amountIn > 0, "Curve: INSUFFICIENT_INPUT_AMOUNT");
        // fromTokenForGetCoinIndices, toTokenForGetCoinIndices:
        // get_coins_indices issue: pool이 (native, token) pair여도 get_coins_indices에서 (wnative, token)을 넣어야만 동작함
        // 따라서, native이면 wnative로 바꿔줌
        address fromTokenForGetCoinIndices = fromToken;
        address toTokenForGetCoinIndices = toToken;
        uint256 ethAmount;
        bool use_eth;
        if (fromToken == _ETH_ADDRESS_) {
            // fromTokenForGetCoinIndices = _WETH_ADDRESS_;
            ethAmount = amountIn;
            use_eth = true;
        }
        if (toToken == _ETH_ADDRESS_) {
            // toTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }
        if (kind == 0) {
            int128 i;
            int128 j;
            bool isUnder;
            if (_isCFR(_registry)) {
                console.log("EllipsisAdapter._swapExactInCryptoCurve: case: isCFR");
                (uint256 i_t, uint256 j_t, bool isUnder_t) = ICurveCryptoFactoryRegistry(_registry).get_coin_indices(
                    pool,
                    fromTokenForGetCoinIndices,
                    toTokenForGetCoinIndices
                );
                i = i_t.toInt256().toInt128();
                j = j_t.toInt256().toInt128();
                isUnder = isUnder_t;
                console.log("EllipsisAdapter._swapExactInCryptoCurve: i=%d, j=%d", i_t, j_t);
            } else if (_isCR(_registry)) {
                console.log("EllipsisAdapter._swapExactInCryptoCurve: case: isCR");
                (i, j, isUnder) = ICurveCryptoRegistry(_registry).get_coin_indices(
                    pool,
                    fromTokenForGetCoinIndices,
                    toTokenForGetCoinIndices
                );
                console.log(
                    "EllipsisAdapter._swapExactInCryptoCurve: i=%d, j=%d",
                    int256(i).toUint256(),
                    int256(j).toUint256()
                );
            } else {
                revert("No matched crypto curve registry");
            }

            // swap
            if (isUnder) {
                if (fromToken == _ETH_ADDRESS_) {
                    console.log("EllipsisAdapter._swapExactInCryptoCurve: case isUnder & fromToken == _ETH_ADDRESS_");
                    ICurveCrypto(pool).exchange_underlying{ value: amountIn }(i, j, amountIn, 1);
                } else {
                    console.log("EllipsisAdapter._swapExactInCryptoCurve: case isUnder & fromToken != _ETH_ADDRESS_");
                    ICurveCrypto(pool).exchange_underlying(i, j, amountIn, 1);
                }
            } else {
                if (fromToken == _ETH_ADDRESS_) {
                    console.log("EllipsisAdapter._swapExactInCryptoCurve: case !isUnder & fromToken == _ETH_ADDRESS_");
                    ICurveCrypto(pool).exchange{ value: amountIn }(i, j, amountIn, 1, msg.sender);
                } else if (toToken == _ETH_ADDRESS_) {
                    console.log(
                        "EllipsisAdapter._swapExactInCryptoCurve: case !isUnder & fromToken != _ETH_ADDRESS_ & toToken == _ETH_ADDRESS_"
                    );
                    ICurveCrypto(pool).exchange(i, j, amountIn, 1, msg.sender);
                } else {
                    console.log(
                        "EllipsisAdapter._swapExactInCryptoCurve: case !isUnder & fromToken != _ETH_ADDRESS_ & toToken != _ETH_ADDRESS_"
                    );
                    console.log("pool : %s", pool);
                    ICurveCrypto(pool).exchange(i, j, amountIn, 1);
                }
            }
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(_registry, pool, toTokenForGetCoinIndices, numCoin);
            if (use_eth) {
                ICurveCrypto(pool).remove_liquidity_one_coin(amountIn, i.toInt256().toInt128(), 1, use_eth);
            } else {
                ICurveCrypto(pool).remove_liquidity_one_coin(amountIn, i.toInt256().toInt128(), 1);
            }
        } else if (kind == 2) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(_registry, pool, fromTokenForGetCoinIndices, numCoin);
            if (numCoin == 2) {
                uint256[2] memory amounts;
                amounts[i] = amountIn;
                if (use_eth) {
                    ICurveCrypto(pool).add_liquidity{ value: ethAmount }(amounts, 1, use_eth);
                } else {
                    ICurveCrypto(pool).add_liquidity(amounts, 1);
                }
            } else if (numCoin == 3) {
                uint256[3] memory amounts;
                amounts[i] = amountIn;
                if (use_eth) {
                    ICurveCrypto(pool).add_liquidity{ value: ethAmount }(amounts, 1, use_eth);
                } else {
                    ICurveCrypto(pool).add_liquidity(amounts, 1);
                }
            }
        }
    }

    /* ========================================================
     * original code
     * ======================================================== */
    // function swapExactIn(
    //     address fromToken,
    //     uint256 amountIn,
    //     address toToken,
    //     address pool,
    //     address to
    // ) external payable override returns (uint256 _output) {
    //     IERC20(fromToken).universalApproveMax(pool, amountIn);

    //     require(amountIn > 0, "Ellipsis: INSUFFICIENT_INPUT_AMOUNT");
    //     address lpToken = ICurveRegistry(registry).get_lp_token(pool);
    //     uint256 n_coin = ICurveRegistry(registry).get_n_coins(pool);

    //     uint256 ethAmount;
    //     if (fromToken == _ETH_ADDRESS_) {
    //         ethAmount = amountIn;
    //     }

    //     if (toToken == lpToken) {
    //         // add liquidity
    //         uint256 i = get_coin_index(pool, n_coin, fromToken);

    //         if (n_coin == 2) {
    //             uint256[2] memory amounts;
    //             amounts[i] = amountIn;
    //             BasePool2Coins(pool).add_liquidity{ value: ethAmount }(amounts, 1);
    //         } else if (n_coin == 3) {
    //             uint256[3] memory amounts;
    //             amounts[i] = amountIn;
    //             BasePool3Coins(pool).add_liquidity{ value: ethAmount }(amounts, 1);
    //         } else {
    //             revert("Ellipsis: Invalid n_coin");
    //         }
    //     } else if (fromToken == lpToken) {
    //         // remove liquidity
    //         uint256 i = get_coin_index(pool, n_coin, toToken);
    //         BasePool2Coins(pool).remove_liquidity_one_coin(amountIn, int128(int256(i)), 1);
    //     } else {
    //         (int128 i, int128 j, bool isUnder) = ICurveRegistry(registry).get_coin_indices(pool, fromToken, toToken);
    //         require(!isUnder, "Ellipsis: NOT_SUPPORT_UNDERLYING");
    //         ICurve(pool).exchange{ value: ethAmount }(i, j, amountIn, 1);
    //     }

    //     _output = IERC20(toToken).uniBalanceOf(address(this));
    //     IERC20(toToken).uniTransfer(to, _output);
    // }

    /* ========================================================
     * new code
     * ======================================================== */
    function swapExactIn(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        address to
    ) external payable override returns (uint256 _output) {
        console.log("EllipsisAdapter.swapExactIn:");
        IERC20(fromToken).universalApproveMax(pool, amountIn);

        require(amountIn > 0, "EllipsisAdapter.swapExactIn: INSUFFICIENT_INPUT_AMOUNT");
        // get lp token
        address mainLPToken = ICurveRegistry(registry).get_lp_token(pool);
        address cryptoLPToken = ICurveRegistry(cryptoRegistry).get_lp_token(pool);

        // get kind
        uint16 kind;
        if (mainLPToken != address(0)) {
            if (fromToken != mainLPToken && toToken != mainLPToken) {
                kind = 0;
            } else if (fromToken == mainLPToken) {
                kind = 1;
            } else if (toToken == mainLPToken) {
                kind = 2;
            }
        } else if (cryptoLPToken != address(0)) {
            if (fromToken != cryptoLPToken && toToken != cryptoLPToken) {
                kind = 0;
            } else if (fromToken == cryptoLPToken) {
                kind = 1;
            } else if (toToken == cryptoLPToken) {
                kind = 2;
            }
        } else {
            kind = 0;
        }

        uint256 cryptoNum = ICurveCryptoRegistry(cryptoRegistry).get_n_coins(pool);
        uint256 mainNum = ICurveRegistry(registry).get_n_coins(pool);

        console.log("EllipsisAdapter.swapExactIn: kind=%d", kind);
        console.log("EllipsisAdapter.getAmountOut: cryptoNum=%d", cryptoNum);
        console.log("EllipsisAdapter.getAmountOut: mainNum=%d", mainNum);

        if (cryptoNum == 0 && mainNum == 0) {
            // CFR
            console.log("EllipsisAdapter.swapExactIn: case: isCFR");
            _swapExactInCryptoCurve(cryptoFactoryRegistry, fromToken, amountIn, toToken, pool, kind);
        } else {
            try ICurveRegistry(registry).get_underlying_coins(pool) {
                // MR
                console.log("EllipsisAdapter.swapExactIn: case: isMR");
                _swapExactInCurve(registry, fromToken, amountIn, toToken, pool, kind);
            } catch {
                // CR
                console.log("EllipsisAdapter.swapExactIn: case: isCR");
                _swapExactInCryptoCurve(cryptoRegistry, fromToken, amountIn, toToken, pool, kind);
            }
        }

        // transfer
        _output = IERC20(toToken).uniBalanceOf(address(this));
        console.log("_output : %d", _output);
        IERC20(toToken).uniTransfer(to, _output);
    }

    /* ========================================================
     * new code (getAmountOut, swapExactIn)
     * ======================================================== */
    // _getAmountOutCurve:
    //   kind:
    //     0: fromToken != LpToken && toToken != LpToken
    //     1: fromToken == LpToken
    //     2: toToken == LpTokens
    function _getAmountOutCurve(
        address _registry,
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        uint16 kind
    ) internal view returns (uint256 _output) {
        require(amountIn > 0, "Curve: INSUFFICIENT_INPUT_AMOUNT");

        // fromTokenForGetCoinIndices, toTokenForGetCoinIndices:
        // get_coins_indices issue: pool이 (native, token) pair여도 get_coins_indices에서 (wnative, token)을 넣어야만 동작함
        // 따라서, native이면 wnative로 바꿔줌
        address fromTokenForGetCoinIndices = fromToken;
        address toTokenForGetCoinIndices = toToken;
        if (fromToken == _ETH_ADDRESS_) {
            // fromTokenForGetCoinIndices = _WETH_ADDRESS_;
        }
        if (toToken == _ETH_ADDRESS_) {
            // toTokenForGetCoinIndices = _WETH_ADDRESS_;
        }

        if (kind == 0) {
            // curve registry, crypto registry
            (int128 i, int128 j, bool isUnder) = ICurveRegistry(_registry).get_coin_indices(
                pool,
                fromTokenForGetCoinIndices,
                toTokenForGetCoinIndices
            );

            if (isUnder) {
                _output = ICurve(pool).get_dy_underlying(i, j, amountIn);
            } else {
                _output = ICurve(pool).get_dy(i, j, amountIn);
            }
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            int128 i = _coinIdx(_registry, pool, toTokenForGetCoinIndices, numCoin).toInt256().toInt128();
            if (numCoin == 2) {
                _output = BasePool2Coins(pool).calc_withdraw_one_coin(amountIn, i);
            } else if (numCoin == 3) {
                _output = BasePool3Coins(pool).calc_withdraw_one_coin(amountIn, i);
            }
        } else if (kind == 2) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(_registry, pool, fromTokenForGetCoinIndices, numCoin);
            if (numCoin == 2) {
                uint256[2] memory amounts;
                amounts[i] = amountIn;
                _output = BasePool2Coins(pool).calc_token_amount(amounts, true);
            } else if (numCoin == 3) {
                uint256[3] memory amounts;
                amounts[i] = amountIn;
                _output = BasePool3Coins(pool).calc_token_amount(amounts, true);
            }
        }
    }

    // _getAmountOutCryptoCurve:
    //   kind:
    //     0: fromToken != LpToken && toToken != LpToken
    //     1: fromToken == LpToken
    //     2: toToken == LpTokens
    function _getAmountOutCryptoCurve(
        address _registry,
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        uint16 kind
    ) internal view returns (uint256 _output) {
        require(amountIn > 0, "Curve: INSUFFICIENT_INPUT_AMOUNT");
        console.log("EllipsisAdapter._getAmountOutCryptoCurve:");
        console.log("EllipsisAdapter._getAmountOutCryptoCurve: _registry=%s", _registry);
        console.log("EllipsisAdapter._getAmountOutCryptoCurve: fromToken=%s", fromToken);
        console.log("EllipsisAdapter._getAmountOutCryptoCurve: amountIn=%d", amountIn);
        console.log("EllipsisAdapter._getAmountOutCryptoCurve: toToken=%s", toToken);
        console.log("EllipsisAdapter._getAmountOutCryptoCurve: pool=%s", pool);
        console.log("EllipsisAdapter._getAmountOutCryptoCurve: kind=%d", kind);

        // fromTokenForGetCoinIndices, toTokenForGetCoinIndices:
        // get_coins_indices issue: pool이 (native, token) pair여도 get_coins_indices에서 (wnative, token)을 넣어야만 동작함
        // 따라서, native이면 wnative로 바꿔줌
        address fromTokenForGetCoinIndices = fromToken;
        address toTokenForGetCoinIndices = toToken;
        bool use_eth;
        if (fromToken == _ETH_ADDRESS_) {
            // fromTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }
        if (toToken == _ETH_ADDRESS_) {
            // toTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }

        if (kind == 0) {
            if (_isCFR(_registry)) {
                console.log("EllipsisAdapter._getAmountOutCryptoCurve: isCFR");
                console.log(
                    "EllipsisAdapter._getAmountOutCryptoCurve: fromTokenForGetCoinIndices=%s",
                    fromTokenForGetCoinIndices
                );
                console.log(
                    "EllipsisAdapter._getAmountOutCryptoCurve: toTokenForGetCoinIndices=%s",
                    toTokenForGetCoinIndices
                );
                (uint256 i, uint256 j, bool isUnder) = ICurveCryptoFactoryRegistry(_registry).get_coin_indices(
                    pool,
                    fromTokenForGetCoinIndices,
                    toTokenForGetCoinIndices
                );
                console.log("EllipsisAdapter._getAmountOutCryptoCurve: i=%d, j=%d", i, j);

                if (isUnder) {
                    _output = ICurveCrypto(pool).get_dy_underlying(
                        i.toInt256().toInt128(),
                        j.toInt256().toInt128(),
                        amountIn
                    );
                } else {
                    _output = ICurveCrypto(pool).get_dy(i.toInt256().toInt128(), j.toInt256().toInt128(), amountIn);
                }
                console.log("EllipsisAdapter._getAmountOutCryptoCurve: _output=%d", _output);
            } else if (_isCR(_registry)) {
                (int128 i, int128 j, bool isUnder) = ICurveCryptoRegistry(_registry).get_coin_indices(
                    pool,
                    fromTokenForGetCoinIndices,
                    toTokenForGetCoinIndices
                );

                if (isUnder) {
                    _output = ICurveCrypto(pool).get_dy_underlying(i, j, amountIn);
                } else {
                    _output = ICurveCrypto(pool).get_dy(i, j, amountIn);
                }
            } else {
                revert("Not valid registry");
            }
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            int128 i = _coinIdx(_registry, pool, toTokenForGetCoinIndices, numCoin).toInt256().toInt128();

            _output = ICurveCrypto(pool).calc_withdraw_one_coin(amountIn, i);
        } else if (kind == 2) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(_registry, pool, fromTokenForGetCoinIndices, numCoin);
            if (numCoin == 2) {
                uint256[2] memory amounts;
                amounts[i] = amountIn;
                _output = ICurveCrypto(pool).calc_token_amount(amounts, true);
            } else if (numCoin == 3) {
                uint256[3] memory amounts;
                amounts[i] = amountIn;
                _output = ICurveCrypto(pool).calc_token_amount(amounts, true);
            }
        }
    }

    function getAmountOut(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool
    ) public view override returns (uint256 _output) {
        console.log("EllipsisAdapter.getAmountOut:");

        // get lp token
        address mainLPToken = ICurveRegistry(registry).get_lp_token(pool);
        address cryptoLPToken = ICurveRegistry(cryptoRegistry).get_lp_token(pool);

        // get kind
        uint16 kind;
        if (mainLPToken != address(0)) {
            if (fromToken != mainLPToken && toToken != mainLPToken) {
                kind = 0;
            } else if (fromToken == mainLPToken) {
                kind = 1;
            } else if (toToken == mainLPToken) {
                kind = 2;
            }
        } else if (cryptoLPToken != address(0)) {
            if (fromToken != cryptoLPToken && toToken != cryptoLPToken) {
                kind = 0;
            } else if (fromToken == cryptoLPToken) {
                kind = 1;
            } else if (toToken == cryptoLPToken) {
                kind = 2;
            }
        } else {
            kind = 0;
        }

        // get MR, CR, CFR case boolean

        uint256 cryptoNum = ICurveCryptoRegistry(cryptoRegistry).get_n_coins(pool);
        uint256 mainNum = ICurveRegistry(registry).get_n_coins(pool);

        console.log("EllipsisAdapter.getAmountOut: cryptoNum=%d", cryptoNum);
        console.log("EllipsisAdapter.getAmountOut: mainNum=%d", mainNum);

        if (cryptoNum == 0 && mainNum == 0) {
            // CFR
            console.log("EllipsisAdapter.getAmountOut: case: isCFR");
            _output = _getAmountOutCryptoCurve(cryptoFactoryRegistry, fromToken, amountIn, toToken, pool, kind);
        } else {
            try ICurveRegistry(registry).get_underlying_coins(pool) {
                // MR
                console.log("EllipsisAdapter.getAmountOut: case: isMR");
                _output = _getAmountOutCurve(registry, fromToken, amountIn, toToken, pool, kind);
            } catch {
                // CR
                console.log("EllipsisAdapter.getAmountOut: case: isCR");
                _output = _getAmountOutCryptoCurve(cryptoRegistry, fromToken, amountIn, toToken, pool, kind);
            }
        }
    }
}
