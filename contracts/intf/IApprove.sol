// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IApprove {
    function claimTokens(
        address token,
        address from,
        address to,
        uint256 amount
    ) external;

    function getProxy() external view returns (address);
}
