// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title TransferLib
 * @notice Utility functions for transfer data encoding/decoding and ID generation.
 */
library TransferLib {
    /// @notice Generates a unique transfer ID
    function generateTransferId(
        address sender,
        address recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(sender, recipient, amount, nonce, timestamp));
    }

    /// @notice Encodes transfer metadata
    function encodeMetadata(
        string memory reference,
        string memory purpose
    ) internal pure returns (bytes memory) {
        return abi.encode(reference, purpose);
    }

    /// @notice Decodes transfer metadata
    function decodeMetadata(bytes memory metadata) internal pure returns (string memory reference, string memory purpose) {
        if (metadata.length == 0) {
            return ("", "");
        }
        return abi.decode(metadata, (string, string));
    }
}
