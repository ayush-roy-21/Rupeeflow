// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockOffRampProvider
 * @dev Mock off-ramp provider contract for testing RupeeFlow
 */
contract MockOffRampProvider is Ownable {
    using SafeERC20 for IERC20;

    event TransferReceived(
        address indexed from,
        address indexed stablecoin,
        uint256 amount,
        string recipientDetails
    );

    event TransferProcessed(
        string indexed transferId,
        address indexed stablecoin,
        uint256 amount,
        string recipientDetails
    );

    // Transfer tracking
    mapping(string => TransferInfo) public transfers;
    mapping(string => bool) public processedTransfers;

    struct TransferInfo {
        address from;
        address stablecoin;
        uint256 amount;
        string recipientDetails;
        uint256 timestamp;
        bool processed;
    }

    constructor() {}

    /**
     * @dev Receive transfer from RupeeFlow
     * @param from Sender address
     * @param stablecoin Stablecoin address
     * @param amount Transfer amount
     * @param recipientDetails Encrypted recipient details
     */
    function receiveTransfer(
        address from,
        address stablecoin,
        uint256 amount,
        string calldata recipientDetails
    ) external {
        require(from != address(0), "MockOffRampProvider: invalid sender");
        require(stablecoin != address(0), "MockOffRampProvider: invalid stablecoin");
        require(amount > 0, "MockOffRampProvider: invalid amount");
        require(bytes(recipientDetails).length > 0, "MockOffRampProvider: invalid details");

        // Generate transfer ID
        string memory transferId = _generateTransferId(from, stablecoin, amount);

        transfers[transferId] = TransferInfo({
            from: from,
            stablecoin: stablecoin,
            amount: amount,
            recipientDetails: recipientDetails,
            timestamp: block.timestamp,
            processed: false
        });

        emit TransferReceived(from, stablecoin, amount, recipientDetails);
    }

    /**
     * @dev Mark transfer as processed
     * @param transferId Transfer ID
     */
    function processTransfer(string calldata transferId) external onlyOwner {
        require(bytes(transferId).length > 0, "MockOffRampProvider: invalid transfer ID");
        
        TransferInfo storage transfer = transfers[transferId];
        require(transfer.from != address(0), "MockOffRampProvider: transfer not found");
        require(!transfer.processed, "MockOffRampProvider: transfer already processed");

        transfer.processed = true;
        processedTransfers[transferId] = true;

        emit TransferProcessed(
            transferId,
            transfer.stablecoin,
            transfer.amount,
            transfer.recipientDetails
        );
    }

    /**
     * @dev Get transfer information
     * @param transferId Transfer ID
     * @return TransferInfo struct
     */
    function getTransfer(string calldata transferId) external view returns (TransferInfo memory) {
        return transfers[transferId];
    }

    /**
     * @dev Check if transfer is processed
     * @param transferId Transfer ID
     * @return True if processed
     */
    function isTransferProcessed(string calldata transferId) external view returns (bool) {
        return processedTransfers[transferId];
    }

    /**
     * @dev Generate transfer ID
     */
    function _generateTransferId(
        address from,
        address stablecoin,
        uint256 amount
    ) internal view returns (string memory) {
        return string(abi.encodePacked(
            "TF",
            _addressToString(from),
            "_",
            _addressToString(stablecoin),
            "_",
            _uintToString(amount),
            "_",
            _uintToString(block.timestamp)
        ));
    }

    /**
     * @dev Convert address to string
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++) {
            b[i] = bytes1(uint8(uint(uint160(addr)) / (2**(8*(19 - i)))));
        }
        return string(b);
    }

    /**
     * @dev Convert uint to string
     */
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
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
