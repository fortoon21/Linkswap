// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

/**
 * @title IFlashLoanReceiverV2 interface
 * @notice Interface for the Aave fee IFlashLoanReceiver.
 * @author Aave
 * @dev implement this interface to develop a flashloan-compatible flashLoanReceiver contract
 **/
interface IFlashLoanReceiverV2 {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}
