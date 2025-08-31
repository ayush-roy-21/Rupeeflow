// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockFXOracle
 * @dev Mock FX oracle contract for testing RupeeFlow
 */
contract MockFXOracle is Ownable {
    // Mock exchange rates (scaled by 1e18)
    mapping(bytes32 => uint256) public exchangeRates;
    
    event ExchangeRateUpdated(string sourceCurrency, string destinationCurrency, uint256 rate);

    constructor() {
        // Set some default rates for testing
        _setRate("INR", "USD", 0.012 * 1e18); // 1 INR = 0.012 USD
        _setRate("USD", "INR", 83.33 * 1e18); // 1 USD = 83.33 INR
        _setRate("RUB", "USD", 0.011 * 1e18); // 1 RUB = 0.011 USD
        _setRate("USD", "RUB", 90.91 * 1e18); // 1 USD = 90.91 RUB
        _setRate("INR", "RUB", 1.09 * 1e18);  // 1 INR = 1.09 RUB
        _setRate("RUB", "INR", 0.92 * 1e18);  // 1 RUB = 0.92 INR
    }

    /**
     * @dev Get exchange rate between two currencies
     * @param sourceCurrency Source currency code
     * @param destinationCurrency Destination currency code
     * @return rate Exchange rate (scaled by 1e18)
     */
    function getExchangeRate(
        string calldata sourceCurrency,
        string calldata destinationCurrency
    ) external view returns (uint256 rate) {
        bytes32 key = keccak256(abi.encodePacked(sourceCurrency, destinationCurrency));
        rate = exchangeRates[key];
        require(rate > 0, "MockFXOracle: rate not found");
        return rate;
    }

    /**
     * @dev Set exchange rate (owner only)
     * @param sourceCurrency Source currency code
     * @param destinationCurrency Destination currency code
     * @param rate Exchange rate (scaled by 1e18)
     */
    function setExchangeRate(
        string calldata sourceCurrency,
        string calldata destinationCurrency,
        uint256 rate
    ) external onlyOwner {
        _setRate(sourceCurrency, destinationCurrency, rate);
    }

    /**
     * @dev Internal function to set rate
     */
    function _setRate(
        string memory sourceCurrency,
        string memory destinationCurrency,
        uint256 rate
    ) internal {
        bytes32 key = keccak256(abi.encodePacked(sourceCurrency, destinationCurrency));
        exchangeRates[key] = rate;
        
        emit ExchangeRateUpdated(sourceCurrency, destinationCurrency, rate);
    }

    /**
     * @dev Check if rate exists
     * @param sourceCurrency Source currency code
     * @param destinationCurrency Destination currency code
     * @return exists True if rate exists
     */
    function hasRate(
        string calldata sourceCurrency,
        string calldata destinationCurrency
    ) external view returns (bool exists) {
        bytes32 key = keccak256(abi.encodePacked(sourceCurrency, destinationCurrency));
        return exchangeRates[key] > 0;
    }
}
