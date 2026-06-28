// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/compliance/AMLModule.sol";
import "../../src/governance/CorridorRegistry.sol";

contract AMLHandler is Test {
    AMLModule public amlModule;
    bytes32 public corridorId = keccak256("US-IN");

    uint256 public ghost_screenedCount;
    uint8[] public ghost_scores;

    constructor(AMLModule _aml) {
        amlModule = _aml;
    }

    function screen(address sender, address recipient, uint256 amountSeed) external {
        if (sender == address(0) || recipient == address(0)) return;
        uint256 amount = bound(amountSeed, 1e6, 1_000_000e6);

        try amlModule.screenTransaction(sender, recipient, amount, corridorId) returns (uint8 score, bool) {
            ghost_screenedCount++;
            ghost_scores.push(score);
        } catch {}
    }

    function ghost_scoreAt(uint256 idx) external view returns (uint8) {
        return ghost_scores[idx];
    }
}
