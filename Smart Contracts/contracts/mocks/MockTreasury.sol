// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockTreasury
 * @dev Mock treasury contract for testing RupeeFlow
 */
contract MockTreasury is Ownable {
    using SafeERC20 for IERC20;

    event TokensReceived(address token, uint256 amount, address from);
    event TokensWithdrawn(address token, uint256 amount, address to);

    constructor() {}

    /**
     * @dev Receive tokens (called by RupeeFlow)
     */
    function receiveTokens(address token, uint256 amount, address from) external {
        emit TokensReceived(token, amount, from);
    }

    /**
     * @dev Withdraw tokens (owner only)
     */
    function withdrawTokens(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
        emit TokensWithdrawn(token, amount, to);
    }

    /**
     * @dev Withdraw ETH (owner only)
     */
    function withdrawETH(uint256 amount, address to) external onlyOwner {
        payable(to).transfer(amount);
    }

    receive() external payable {}
}
