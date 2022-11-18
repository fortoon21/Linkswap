// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { IERC20Metadata } from "../intf/IERC20Metadata.sol";
import { ICurve, ICurveRegistry, ICurveFactoryRegistry } from "../SmartRoute/intf/IEllipsis.sol";

import "./intf/ICurvePoolInfoViewer.sol";

/*
 * @dev: for test only
 */
import "hardhat/console.sol";

contract EllipsisViewer is ICurvePoolInfoViewer {
    address public immutable registry;

    constructor(address _registry) {
        registry = _registry;
    }

    function getPoolInfo(address pool) public view override returns (CurvePoolInfo memory) {
        ICurve curvePool = ICurve(pool);
        IERC20Metadata token;
        uint256 tokenNum;

        uint256[2] memory fees;
        uint256 isMeta;
        address[] memory tokenList;
        uint256[] memory tokenBalances;

        ICurveRegistry curveRegistry = ICurveRegistry(registry);
        tokenNum = curveRegistry.get_n_coins(pool);
        token = IERC20Metadata(curveRegistry.get_lp_token(pool));
        address[4] memory tmp = curveRegistry.get_coins(pool);
        uint256[4] memory _tmp = curveRegistry.get_balances(pool);
        fees = curveRegistry.get_fees(pool);
        isMeta = curveRegistry.is_meta(pool) ? 1 : 0;
        tokenList = new address[](tokenNum);
        tokenBalances = new uint256[](tokenNum);
        for (uint256 i; i < tokenNum; i++) {
            tokenList[i] = tmp[i];
            tokenBalances[i] = _tmp[i];
        }

        return
            CurvePoolInfo({
                totalSupply: token.totalSupply(),
                A: curvePool.A(),
                fees: fees,
                tokenBalances: tokenBalances,
                pool: pool,
                lpToken: address(token),
                tokenList: tokenList,
                isMeta: isMeta,
                decimals: token.decimals(),
                name: token.name(),
                symbol: token.symbol()
            });
    }

    function pools() external view returns (address[] memory) {
        uint256 regiNum = ICurveRegistry(registry).pool_count();
        address[] memory _pools = new address[](regiNum);

        for (uint256 i; i < regiNum; i++) {
            _pools[i] = ICurveRegistry(registry).pool_list(i);
        }
        return _pools;
    }
}
