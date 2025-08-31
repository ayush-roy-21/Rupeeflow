// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockOnRampProvider
 * @dev Mock on-ramp provider contract for testing RupeeFlow
 */
contract MockOnRampProvider is Ownable {
    using SafeERC20 for IERC20;

    event PaymentReceived(
        address indexed user,
        address indexed stablecoin,
        uint256 amount,
        string ref
    );

    event PaymentProcessed(
        address indexed user,
        address indexed stablecoin,
        uint256 amount,
        string ref
    );

    // Payment status tracking
    mapping(string => bool) public processedPayments;
    mapping(string => PaymentInfo) public payments;

    struct PaymentInfo {
        address user;
        address stablecoin;
        uint256 amount;
        uint256 timestamp;
        bool processed;
    }

    constructor() {}

    /**
     * @dev Simulate receiving a payment
     * @param user User address
     * @param stablecoin Stablecoin address
     * @param amount Payment amount
     * @param ref Payment ref
     */
    function receivePayment(
        address user,
        address stablecoin,
        uint256 amount,
        string calldata ref
    ) external onlyOwner {
        require(user != address(0), "MockOnRampProvider: invalid user");
        require(stablecoin != address(0), "MockOnRampProvider: invalid stablecoin");
        require(amount > 0, "MockOnRampProvider: invalid amount");
        require(bytes(ref).length > 0, "MockOnRampProvider: invalid ref");

        payments[ref] = PaymentInfo({
            user: user,
            stablecoin: stablecoin,
            amount: amount,
            timestamp: block.timestamp,
            processed: false
        });

        emit PaymentReceived(user, stablecoin, amount, ref);
    }

    /**
     * @dev Mark payment as processed
     * @param ref Payment ref
     */
    function processPayment(string calldata ref) external onlyOwner {
        require(bytes(ref).length > 0, "MockOnRampProvider: invalid ref");
        
        PaymentInfo storage payment = payments[ref];
        require(payment.user != address(0), "MockOnRampProvider: payment not found");
        require(!payment.processed, "MockOnRampProvider: payment already processed");

        payment.processed = true;
        processedPayments[ref] = true;

        emit PaymentProcessed(
            payment.user,
            payment.stablecoin,
            payment.amount,
            ref
        );
    }

    /**
     * @dev Get payment information
     * @param ref Payment ref
     * @return PaymentInfo struct
     */
    function getPayment(string calldata ref) external view returns (PaymentInfo memory) {
        return payments[ref];
    }

    /**
     * @dev Check if payment is processed
     * @param ref Payment ref
     * @return True if processed
     */
    function isPaymentProcessed(string calldata ref) external view returns (bool) {
        return processedPayments[ref];
    }

    /**
     * @dev Withdraw tokens (owner only)
     */
    function withdrawTokens(address token, uint256 amount, address to) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @dev Withdraw ETH (owner only)
     */
    function withdrawETH(uint256 amount, address to) external onlyOwner {
        payable(to).transfer(amount);
    }

    receive() external payable {}
}
