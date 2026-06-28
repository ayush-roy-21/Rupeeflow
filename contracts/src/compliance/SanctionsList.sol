// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SanctionsList
 * @notice On-chain blocklist oracle mapping sanctioned wallet addresses.
 */
contract SanctionsList is AccessControl {
    bytes32 public constant SANCTIONS_ADMIN_ROLE = keccak256("SANCTIONS_ADMIN_ROLE");

    mapping(address => bool) private _sanctioned;

    event SanctionsListUpdated(uint256 addedCount, uint256 removedCount);
    event AddressSanctioned(address indexed account, bool sanctioned);

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SANCTIONS_ADMIN_ROLE, admin);
    }

    function isSanctioned(address account) external view returns (bool) {
        return _sanctioned[account];
    }

    function updateSanctionsList(
        address[] calldata toAdd,
        address[] calldata toRemove
    ) external onlyRole(SANCTIONS_ADMIN_ROLE) {
        for (uint256 i = 0; i < toAdd.length; i++) {
            if (!_sanctioned[toAdd[i]]) {
                _sanctioned[toAdd[i]] = true;
                emit AddressSanctioned(toAdd[i], true);
            }
        }
        for (uint256 i = 0; i < toRemove.length; i++) {
            if (_sanctioned[toRemove[i]]) {
                _sanctioned[toRemove[i]] = false;
                emit AddressSanctioned(toRemove[i], false);
            }
        }
        emit SanctionsListUpdated(toAdd.length, toRemove.length);
    }
}
