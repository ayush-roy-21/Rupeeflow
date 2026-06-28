// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/ICorridorRegistry.sol";
import "../libraries/CorridorLib.sol";

/**
 * @title CorridorRegistry
 * @notice Manages remittance corridor configurations and settlement CBDC mappings.
 */
contract CorridorRegistry is ICorridorRegistry, AccessControl {
    using CorridorLib for Corridor;

    bytes32 public constant CORRIDOR_ADMIN_ROLE = keccak256("CORRIDOR_ADMIN_ROLE");

    mapping(bytes32 => Corridor) private _corridors;
    bytes32[] private _corridorIds;
    mapping(bytes32 => bool) private _registered;

    error InvalidCorridorConfiguration();
    error CorridorAlreadyExists();
    error CorridorNotFound();

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CORRIDOR_ADMIN_ROLE, admin);
    }

    function registerCorridor(Corridor calldata corridor) external override onlyRole(CORRIDOR_ADMIN_ROLE) {
        if (!corridor.validate()) revert InvalidCorridorConfiguration();
        if (_registered[corridor.id]) revert CorridorAlreadyExists();

        _corridors[corridor.id] = corridor;
        _corridorIds.push(corridor.id);
        _registered[corridor.id] = true;

        emit CorridorRegistered(corridor.id, corridor.sourceCountry, corridor.destCountry, corridor.settlementToken);
    }

    function updateCorridor(bytes32 corridorId, Corridor calldata corridor) external override onlyRole(CORRIDOR_ADMIN_ROLE) {
        if (!_registered[corridorId]) revert CorridorNotFound();
        if (corridor.id != corridorId || !corridor.validate()) revert InvalidCorridorConfiguration();

        _corridors[corridorId] = corridor;
        emit CorridorUpdated(corridorId, corridor.active);
    }

    function deactivateCorridor(bytes32 corridorId) external override onlyRole(CORRIDOR_ADMIN_ROLE) {
        if (!_registered[corridorId]) revert CorridorNotFound();
        _corridors[corridorId].active = false;
        emit CorridorDeactivated(corridorId);
    }

    function getCorridor(bytes32 corridorId) external view override returns (Corridor memory) {
        if (!_registered[corridorId]) revert CorridorNotFound();
        return _corridors[corridorId];
    }

    function getActiveCorridors() external view override returns (Corridor[] memory) {
        uint256 activeCount = 0;
        uint256 total = _corridorIds.length;
        for (uint256 i = 0; i < total; i++) {
            if (_corridors[_corridorIds[i]].active) {
                activeCount++;
            }
        }

        Corridor[] memory active = new Corridor[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            Corridor memory c = _corridors[_corridorIds[i]];
            if (c.active) {
                active[index++] = c;
            }
        }
        return active;
    }

    function isCorridorActive(bytes32 corridorId) external view override returns (bool) {
        return _registered[corridorId] && _corridors[corridorId].active;
    }
}
