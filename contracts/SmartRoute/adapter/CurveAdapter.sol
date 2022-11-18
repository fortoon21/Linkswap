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
    BaseLendingPool3Coins,
    BaseLendingPool2Coins
} from "../intf/ICurve.sol";
import { IERC20 } from "../../intf/IERC20.sol";
import { SafeMath } from "../../lib/SafeMath.sol";
import { UniERC20 } from "../../lib/UniERC20.sol";
import { SafeERC20 } from "../../lib/SafeERC20.sol";
import { SafeCast } from "../../lib/SafeCast.sol";
import "hardhat/console.sol";

// In curve factory = registry
contract CurveAdapter is IRouterAdapter {
    using SafeMath for uint256;
    using UniERC20 for IERC20;
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeCast for int256;
    address public constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address public immutable _WETH_ADDRESS_;
    address public immutable registry;
    address public immutable cryptoRegistry;
    address public immutable factoryRegistry;
    address public immutable cryptoFactoryRegistry;

    mapping(address => address[2]) public baseCoins;

    constructor(
        address __WETH_ADDRESS_,
        address _registry,
        address _cryptoRegistry,
        address _factoryRegistry,
        address _cryptoFactoryRegistry
    ) {
        _WETH_ADDRESS_ = __WETH_ADDRESS_;
        registry = _registry;
        cryptoRegistry = _cryptoRegistry;
        factoryRegistry = _factoryRegistry;
        cryptoFactoryRegistry = _cryptoFactoryRegistry;
    }

    receive() external payable {}

    function _numCoin(address _registry, address pool) internal view returns (uint256) {
        if (_registry == registry) {
            return ICurveRegistry(_registry).get_n_coins(pool)[0];
        } else if (_registry == factoryRegistry) {
            return ICurveFactoryRegistry(_registry).get_n_coins(pool);
        } else if (_registry == cryptoRegistry) {
            return ICurveCryptoRegistry(_registry).get_n_coins(pool);
        } else if (_registry == cryptoFactoryRegistry) {
            return ICurveCryptoFactoryRegistry(_registry).get_n_coins(pool);
        } else {
            revert("CurveAdapter._numCoin: invalid registry");
        }
    }

    function _isLending(address pool) internal view returns (bool) {
        return ICurve(pool).underlying_coins(0) != ICurve(pool).coins(0);
    }

    function _coinIdx(
        address pool,
        address coin,
        uint256 numCoin
    ) internal view returns (uint256) {
        console.log("CurveAdapter._coinIdx: coin=%s", coin);
        for (uint256 i; i < numCoin; i++) {
            console.log("CurveAdapter._coinIdx: coin[%d]=%s", i, ICurve(pool).underlying_coins(i));
            if (ICurve(pool).underlying_coins(i) == coin) {
                return i;
            }
        }
        revert("CurveAdapter._coinIdx: Not matched coin index");
    }

    function _isRegistry(address _registry) internal view returns (bool) {
        return _registry == registry;
    }

    function _isCryptoRegistry(address _registry) internal view returns (bool) {
        return _registry == cryptoRegistry;
    }

    function _isFactoryRegistry(address _registry) internal view returns (bool) {
        return _registry == factoryRegistry;
    }

    function _isCryptoFactoryRegistry(address _registry) internal view returns (bool) {
        return _registry == cryptoFactoryRegistry;
    }

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
            fromTokenForGetCoinIndices = _WETH_ADDRESS_;
        }
        if (toToken == _ETH_ADDRESS_) {
            toTokenForGetCoinIndices = _WETH_ADDRESS_;
        }

        if (kind == 0) {
            (int128 i, int128 j, bool isUnder) = ICurveRegistry(_registry).get_coin_indices(
                pool,
                fromTokenForGetCoinIndices,
                toTokenForGetCoinIndices
            );
            if (isUnder && (_registry == registry || ICurveRegistry(_registry).is_meta(pool))) {
                _output = ICurve(pool).get_dy_underlying(i, j, amountIn);
            } else {
                _output = ICurve(pool).get_dy(i, j, amountIn);
            }
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            int128 i = _coinIdx(pool, toTokenForGetCoinIndices, numCoin).toInt256().toInt128();
            if (numCoin == 2) {
                _output = BasePool2Coins(pool).calc_withdraw_one_coin(amountIn, i);
            } else if (numCoin == 3) {
                _output = BasePool3Coins(pool).calc_withdraw_one_coin(amountIn, i);
            }
        } else if (kind == 2) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(pool, fromTokenForGetCoinIndices, numCoin);
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

        // fromTokenForGetCoinIndices, toTokenForGetCoinIndices:
        // get_coins_indices issue: pool이 (native, token) pair여도 get_coins_indices에서 (wnative, token)을 넣어야만 동작함
        // 따라서, native이면 wnative로 바꿔줌
        address fromTokenForGetCoinIndices = fromToken;
        address toTokenForGetCoinIndices = toToken;
        bool use_eth;
        if (fromToken == _ETH_ADDRESS_) {
            fromTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }
        if (toToken == _ETH_ADDRESS_) {
            toTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }

        if (kind == 0) {
            (uint256 i, uint256 j) = ICurveCryptoRegistry(_registry).get_coin_indices(
                pool,
                fromTokenForGetCoinIndices,
                toTokenForGetCoinIndices
            );

            _output = ICurveCrypto(pool).get_dy(i, j, amountIn);
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(pool, toTokenForGetCoinIndices, numCoin);

            _output = ICurveCrypto(pool).calc_withdraw_one_coin(amountIn, i);
        } else if (kind == 2) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(pool, fromTokenForGetCoinIndices, numCoin);
            if (numCoin == 2) {
                uint256[2] memory amounts;
                amounts[i] = amountIn;
                _output = ICurveCrypto(pool).calc_token_amount(amounts);
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
        console.log("CurveAdapter.getAmountOut:");
        console.log("CurveAdapter.getAmountOut: fromToken=%s", fromToken);
        console.log("CurveAdapter.getAmountOut: toToken=%s", toToken);
        console.log("CurveAdapter.getAmountOut: amountIn=%s", amountIn);
        console.log("CurveAdapter.getAmountOut: pool=%s", pool);

        /* ========================================================
         * new code
         * ======================================================== */
        // M: main
        // R: registry
        // C: crypto
        bool isMR = ICurveRegistry(registry).get_lp_token(pool) != address(0);
        console.log("CurveAdapter.getAmountOut: isMR=%s", isMR);
        bool isMFR = ICurveFactoryRegistry(factoryRegistry).get_n_coins(pool) != 0;
        console.log("CurveAdapter.getAmountOut: isMFR=%s", isMFR);
        bool isCR = ICurveCryptoRegistry(cryptoRegistry).get_lp_token(pool) != address(0);
        console.log("CurveAdapter.getAmountOut: isCR=%s", isCR);
        bool isCFR = ICurveCryptoFactoryRegistry(cryptoFactoryRegistry).get_token(pool) != address(0);
        console.log("CurveAdapter.getAmountOut: isCFR=%s", isCFR);

        address mainLPToken = ICurveRegistry(registry).get_lp_token(pool);
        address cryptoLPToken = ICurveRegistry(cryptoRegistry).get_lp_token(pool);
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

        if (isMR) {
            console.log("CurveAdapter.getAmountOut: case: isMR");
            _output = _getAmountOutCurve(registry, fromToken, amountIn, toToken, pool, kind);
        } else if (isMFR) {
            console.log("CurveAdapter.getAmountOut: case: isMFR");
            _output = _getAmountOutCurve(factoryRegistry, fromToken, amountIn, toToken, pool, kind);
        } else if (isCR) {
            console.log("CurveAdapter.getAmountOut: case: isCR");
            _output = _getAmountOutCryptoCurve(cryptoRegistry, fromToken, amountIn, toToken, pool, kind);
        } else if (isCFR) {
            console.log("CurveAdapter.getAmountOut: case: isCFR");
            _output = _getAmountOutCryptoCurve(cryptoFactoryRegistry, fromToken, amountIn, toToken, pool, kind);
        } else {
            console.log("CurveAdapter.getAmountOut: case: no match");
            revert("CurveAdapter.getAmountOut: case: no match");
        }
    }

    function _swapExactInCurve(
        address _registry,
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        uint16 kind
    ) internal {
        require(amountIn > 0, "Curve: INSUFFICIENT_INPUT_AMOUNT");
        // fromTokenForGetCoinIndices, toTokenForGetCoinIndices:
        // get_coins_indices issue: pool이 (native, token) pair여도 get_coins_indices에서 (wnative, token)을 넣어야만 동작함
        // 따라서, native이면 wnative로 바꿔줌
        address fromTokenForGetCoinIndices = fromToken;
        address toTokenForGetCoinIndices = toToken;
        uint256 ethAmount;
        bool use_eth;
        if (fromToken == _ETH_ADDRESS_) {
            fromTokenForGetCoinIndices = _WETH_ADDRESS_;
            ethAmount = amountIn;
            use_eth = true;
        }
        if (toToken == _ETH_ADDRESS_) {
            toTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }

        console.log("CurveAdapter._swapExactInCurve: ethAmount=%d", ethAmount);
        console.log("CurveAdapter._swapExactInCurve: use_eth=%s", use_eth);
        console.log("CurveAdapter._swapExactInCurve: kind=%d", kind);
        if (kind == 0) {
            (int128 i, int128 j, bool isUnder) = ICurveRegistry(_registry).get_coin_indices(
                pool,
                fromTokenForGetCoinIndices,
                toTokenForGetCoinIndices
            );

            if (isUnder && _registry == factoryRegistry && ICurveRegistry(_registry).is_meta(pool)) {
                address[2] memory _baseCoins = baseCoins[pool];
                if (_baseCoins[0] == address(0)) {
                    _baseCoins = [ICurve(pool).coins(0), ICurve(pool).coins(1)];
                    baseCoins[pool] = _baseCoins;
                }
                isUnder =
                    (fromToken != _baseCoins[0] && fromToken != _baseCoins[1]) ||
                    (toToken != _baseCoins[0] && toToken != _baseCoins[1]);
            }

            if (isUnder) {
                ICurve(pool).exchange_underlying{ value: ethAmount }(i, j, amountIn, 1);
            } else {
                ICurve(pool).exchange{ value: ethAmount }(i, j, amountIn, 1);
            }
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            bool isLending = _isLending(pool);
            int128 i = _coinIdx(pool, toTokenForGetCoinIndices, numCoin).toInt256().toInt128();
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
            bool isLending = _isLending(pool);
            uint256 i = _coinIdx(pool, fromTokenForGetCoinIndices, numCoin);
            console.log("CurveAdapter._swapExactInCurve: numCoin=%d", numCoin);
            console.log("CurveAdapter._swapExactInCurve: isLending=%s", isLending);
            if (numCoin == 2) {
                uint256[2] memory amounts;
                amounts[i] = amountIn;
                if (isLending) {
                    BaseLendingPool2Coins(pool).add_liquidity(amounts, 1, true);
                } else {
                    BasePool2Coins(pool).add_liquidity(amounts, 1);
                }
            } else if (numCoin == 3) {
                uint256[3] memory amounts;
                amounts[i] = amountIn;
                if (isLending) {
                    BaseLendingPool3Coins(pool).add_liquidity(amounts, 1, true);
                } else {
                    BasePool3Coins(pool).add_liquidity(amounts, 1);
                }
            }
        }
    }

    function _swapExactInCryptoCurve(
        address _registry,
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        uint16 kind
    ) internal {
        require(amountIn > 0, "Curve: INSUFFICIENT_INPUT_AMOUNT");
        // fromTokenForGetCoinIndices, toTokenForGetCoinIndices:
        // get_coins_indices issue: pool이 (native, token) pair여도 get_coins_indices에서 (wnative, token)을 넣어야만 동작함
        // 따라서, native이면 wnative로 바꿔줌
        address fromTokenForGetCoinIndices = fromToken;
        address toTokenForGetCoinIndices = toToken;
        uint256 ethAmount;
        bool use_eth;
        if (fromToken == _ETH_ADDRESS_) {
            fromTokenForGetCoinIndices = _WETH_ADDRESS_;
            ethAmount = amountIn;
            use_eth = true;
        }
        if (toToken == _ETH_ADDRESS_) {
            toTokenForGetCoinIndices = _WETH_ADDRESS_;
            use_eth = true;
        }
        if (kind == 0) {
            // get coin indices
            (uint256 i, uint256 j) = ICurveCryptoRegistry(_registry).get_coin_indices(
                pool,
                fromTokenForGetCoinIndices,
                toTokenForGetCoinIndices
            );

            // swap
            if (fromToken == _ETH_ADDRESS_) {
                ICurveCrypto(pool).exchange{ value: amountIn }(i, j, amountIn, 1, true);
            } else if (toToken == _ETH_ADDRESS_) {
                ICurveCrypto(pool).exchange(i, j, amountIn, 1, true);
            } else {
                ICurveCrypto(pool).exchange(i, j, amountIn, 1);
            }
        } else if (kind == 1) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(pool, toTokenForGetCoinIndices, numCoin);
            ICurveCrypto(pool).remove_liquidity_one_coin(amountIn, i, 1);
        } else if (kind == 2) {
            uint256 numCoin = _numCoin(_registry, pool);
            uint256 i = _coinIdx(pool, fromTokenForGetCoinIndices, numCoin);
            if (numCoin == 2) {
                uint256[2] memory amounts;
                amounts[i] = amountIn;
                ICurveCrypto(pool).add_liquidity{ value: ethAmount }(amounts, 1, use_eth);
            } else if (numCoin == 3) {
                uint256[3] memory amounts;
                amounts[i] = amountIn;
                ICurveCrypto(pool).add_liquidity{ value: ethAmount }(amounts, 1);
            }
        }
    }

    function swapExactIn(
        address fromToken,
        uint256 amountIn,
        address toToken,
        address pool,
        address to
    ) external payable override returns (uint256 _output) {
        /* ========================================================
         * new code
         * ======================================================== */
        // M: main
        // R: registry
        // C: crypto
        bool isMR = ICurveRegistry(registry).get_lp_token(pool) != address(0);
        console.log("CurveAdapter.swapExactIn: isMR=%s", isMR);
        bool isMFR = ICurveFactoryRegistry(factoryRegistry).get_n_coins(pool) != 0;
        console.log("CurveAdapter.swapExactIn: isMFR=%s", isMFR);
        bool isCR = ICurveCryptoRegistry(cryptoRegistry).get_lp_token(pool) != address(0);
        console.log("CurveAdapter.swapExactIn: isCR=%s", isCR);
        bool isCFR = ICurveCryptoFactoryRegistry(cryptoFactoryRegistry).get_token(pool) != address(0);
        console.log("CurveAdapter.swapExactIn: isCFR=%s", isCFR);

        IERC20(fromToken).universalApproveMax(pool, amountIn);

        address mainLPToken = ICurveRegistry(registry).get_lp_token(pool);
        address cryptoLPToken = ICurveRegistry(cryptoRegistry).get_lp_token(pool);
        uint16 kind;
        if (mainLPToken != address(0)) {
            if (fromToken != mainLPToken && toToken != mainLPToken) {
                kind = 0;
            } else if (fromToken == mainLPToken) {
                kind = 1;
            } else if (toToken == mainLPToken) {
                kind = 2;
            }
        } else if (cryptoLPToken != address(0) && fromToken != mainLPToken && toToken != mainLPToken) {
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

        // (1)
        // case (fromToken=native): transfer: adapter -> pool, token: fromToken
        // case (fromToken=token): approve: adapter -> pool, token: fromToken
        // (2)
        // transfer: pool -> adapter, token: fromToken -> toToken
        if (isMR) {
            console.log("CurveAdapter.swapExactIn: case: isMR");
            _swapExactInCurve(registry, fromToken, amountIn, toToken, pool, kind);
        } else if (isMFR) {
            console.log("CurveAdapter.swapExactIn: case: isMFR");
            _swapExactInCurve(factoryRegistry, fromToken, amountIn, toToken, pool, kind);
        } else if (isCR) {
            console.log("CurveAdapter.swapExactIn: case: isCR");
            _swapExactInCryptoCurve(cryptoRegistry, fromToken, amountIn, toToken, pool, kind);
        } else if (isCFR) {
            console.log("CurveAdapter.swapExactIn: case: isCFR");
            _swapExactInCryptoCurve(cryptoFactoryRegistry, fromToken, amountIn, toToken, pool, kind);
        } else {
            console.log("CurveAdapter.swapExactIn: case: no match");
            revert("CurveAdapter.swapExactIn: case: no match");
        }

        // transfer: adatper -> to, token: toToken
        _output = IERC20(toToken).uniBalanceOf(address(this));
        IERC20(toToken).uniTransfer(to, _output);

        /* ========================================================
         * original code
         * ======================================================== */
        // if (ICurveRegistry(registry).get_lp_token(pool) != address(0)) {
        //     _swapExactInCurve(registry, fromToken, amountIn, toToken, pool);
        // } else {
        //     if (ICurveFactoryRegistry(factoryRegistry).get_coins(pool)[0] != address(0)) {
        //         _swapExactInCurve(factoryRegistry, fromToken, amountIn, toToken, pool);
        //     } else {
        //         _swapExactInCryptoCurve(
        //             ICurveCryptoRegistry(cryptoRegistry).get_lp_token(pool) != address(0)
        //                 ? cryptoRegistry
        //                 : cryptoFactoryRegistry,
        //             fromToken,
        //             amountIn,
        //             toToken,
        //             pool
        //         );
        //     }
        // }
        // _output = IERC20(toToken).uniBalanceOf(address(this));

        // IERC20(toToken).uniTransfer(to, _output);
    }
}
