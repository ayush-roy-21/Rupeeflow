// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IPausableContract {
    function pause() external;
    function unpause() external;
}

/**
 * @title EmergencyGuardian
 * @notice Protocol-wide circuit breaker allowing authorized guardians to halt operations in emergencies.
 */
contract EmergencyGuardian is AccessControl {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    address[] public controlledContracts;
    uint256 public unpauseDelay = 12 hours;
    uint256 public pausedAt;
    bool public isPaused;

    event ProtocolPaused(address indexed guardian);
    event ProtocolUnpaused(address indexed guardian);
    event ControlledContractAdded(address indexed target);
    event UnpauseDelayUpdated(uint256 oldDelay, uint256 newDelay);

    error ProtocolNotPaused();
    error UnpauseTimelockActive();

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GUARDIAN_ROLE, admin);
    }

    function addControlledContract(address target) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(target != address(0), "Zero address");
        controlledContracts.push(target);
        emit ControlledContractAdded(target);
    }

    function emergencyPause() external onlyRole(GUARDIAN_ROLE) {
        isPaused = true;
        pausedAt = block.timestamp;
        for (uint256 i = 0; i < controlledContracts.length; i++) {
            try IPausableContract(controlledContracts[i]).pause() {} catch {}
        }
        emit ProtocolPaused(msg.sender);
    }

    function unpause() external onlyRole(GUARDIAN_ROLE) {
        if (!isPaused) revert ProtocolNotPaused();
        if (block.timestamp < pausedAt + unpauseDelay) revert UnpauseTimelockActive();

        isPaused = false;
        for (uint256 i = 0; i < controlledContracts.length; i++) {
            try IPausableContract(controlledContracts[i]).unpause() {} catch {}
        }
        emit ProtocolUnpaused(msg.sender);
    }

    function setUnpauseDelay(uint256 delay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 old = unpauseDelay;
        unpauseDelay = delay;
        emit UnpauseDelayUpdated(old, delay);
    }
}
