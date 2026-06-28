// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../interfaces/ICorridorRegistry.sol";

/**
 * @title CorridorLib
 * @notice Corridor utility functions.
 */
library CorridorLib {
    /// @notice Creates a corridor ID from country codes
    function corridorId(
        string memory source,
        string memory dest
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(source, "-", dest));
    }

    /// @notice Validates corridor configuration
    function validate(ICorridorRegistry.Corridor memory corridor) internal pure returns (bool) {
        if (corridor.settlementToken == address(0)) return false;
        if (bytes(corridor.sourceCountry).length == 0 || bytes(corridor.destCountry).length == 0) return false;
        if (corridor.minAmount == 0 || corridor.maxAmount < corridor.minAmount) return false;
        if (corridor.dailyLimit < corridor.maxAmount) return false;
        if (corridor.expiryDuration == 0) return false;
        return true;
    }
}
