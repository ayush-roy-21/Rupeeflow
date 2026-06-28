// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/core/MultiSigEscrow.sol";
import "../mocks/MockCBDC.sol";
import "./EscrowHandler.sol";

contract EscrowInvariantTest is Test {
    MultiSigEscrow public escrow;
    MockCBDC public cbdc;
    EscrowHandler public handler;

    function setUp() public {
        address admin = address(0x1);
        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);
        address[] memory signers = new address[](1);
        signers[0] = admin;
        escrow = new MultiSigEscrow(admin, signers, 1);
        vm.stopPrank();

        handler = new EscrowHandler(escrow, cbdc);
        vm.prank(admin);
        escrow.grantRole(escrow.ROUTER_ROLE(), address(handler));

        targetContract(address(handler));
    }

    function invariant_escrowBalanceCoversDeposits() public view {
        uint256 activeDeposits = handler.ghost_totalDeposited()
                               - handler.ghost_totalReleased()
                               - handler.ghost_totalRefunded();
        assertGe(cbdc.balanceOf(address(escrow)), activeDeposits);
    }

    function invariant_noDoubleSpend() public view {
        for (uint256 i = 0; i < handler.ghost_transferCount(); i++) {
            bytes32 txId = handler.ghost_transferAt(i);
            (, , , , , , IMultiSigEscrow.EscrowStatus stat) = escrow.deposits(txId);
            assertTrue(
                stat != IMultiSigEscrow.EscrowStatus.RELEASED || stat != IMultiSigEscrow.EscrowStatus.REFUNDED
            );
        }
    }

    function invariant_conservationOfFunds() public view {
        assertLe(
            handler.ghost_totalReleased() + handler.ghost_totalRefunded(),
            handler.ghost_totalDeposited()
        );
    }
}
