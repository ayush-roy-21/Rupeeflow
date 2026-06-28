// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/core/MultiSigEscrow.sol";
import "../mocks/MockCBDC.sol";

contract EscrowHandler is Test {
    MultiSigEscrow public escrow;
    MockCBDC public cbdc;
    address public router = address(0x10);

    uint256 public ghost_totalDeposited;
    uint256 public ghost_totalReleased;
    uint256 public ghost_totalRefunded;
    bytes32[] public transferIds;

    constructor(MultiSigEscrow _escrow, MockCBDC _cbdc) {
        escrow = _escrow;
        cbdc = _cbdc;
        cbdc.mint(router, 1_000_000_000e6);
        vm.prank(router);
        cbdc.approve(address(escrow), type(uint256).max);
    }

    function deposit(uint256 amountSeed) external {
        uint256 amount = bound(amountSeed, 1e6, 100_000e6);
        bytes32 txId = keccak256(abi.encodePacked(ghost_totalDeposited, block.timestamp));
        transferIds.push(txId);

        vm.prank(router);
        escrow.deposit(txId, address(0x20), address(0x30), address(cbdc), amount, block.timestamp + 86400);
        ghost_totalDeposited += amount;
    }

    function refund(uint256 indexSeed) external {
        if (transferIds.length == 0) return;
        bytes32 txId = transferIds[indexSeed % transferIds.length];
        (, , , uint256 amt, , uint256 exp, IMultiSigEscrow.EscrowStatus stat) = escrow.deposits(txId);

        if (stat == IMultiSigEscrow.EscrowStatus.DEPOSITED) {
            vm.warp(exp + 1);
            vm.prank(router);
            escrow.refund(txId);
            ghost_totalRefunded += amt;
        }
    }

    function ghost_transferCount() external view returns (uint256) {
        return transferIds.length;
    }

    function ghost_transferAt(uint256 idx) external view returns (bytes32) {
        return transferIds[idx];
    }
}
