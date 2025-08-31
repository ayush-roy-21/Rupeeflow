// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT contract for testing RupeeFlow
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private _decimals = 6;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) { }

    /**
     * @dev Mint tokens (owner only)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Get token decimals
     * @return Token decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
