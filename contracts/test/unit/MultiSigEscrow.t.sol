// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/core/MultiSigEscrow.sol";
import "../mocks/MockCBDC.sol";

contract MultiSigEscrowTest is Test {
    MultiSigEscrow public escrow;
    MockCBDC public cbdc;

    address public admin = address(0x1);
    address public router = address(0x2);
    address public depositor = address(0x3);
    address public beneficiary = address(0x4);

    uint256 public signer1Pk = 0xA11CE;
    uint256 public signer2Pk = 0xB0B;
    uint256 public signer3Pk = 0xC0D3;
    address public signer1;
    address public signer2;
    address public signer3;

    bytes32 public transferId = keccak256("TX_1");

    function setUp() public {
        signer1 = vm.addr(signer1Pk);
        signer2 = vm.addr(signer2Pk);
        signer3 = vm.addr(signer3Pk);

        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);

        address[] memory signers = new address[](3);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        escrow = new MultiSigEscrow(admin, signers, 2);
        escrow.grantRole(escrow.ROUTER_ROLE(), router);
        vm.stopPrank();

        cbdc.mint(router, 10_000e6);
        vm.prank(router);
        cbdc.approve(address(escrow), type(uint256).max);
    }

    function _signRelease(
        uint256 pk,
        bytes32 txId,
        address ben,
        address token,
        uint256 amt,
        uint256 nonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(escrow.RELEASE_TYPEHASH(), txId, ben, token, amt, nonce)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", escrow.DOMAIN_SEPARATOR(), structHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_deposit_success() public {
        vm.prank(router);
        escrow.deposit(transferId, depositor, beneficiary, address(cbdc), 1000e6, block.timestamp + 86400);

        (address dep, address ben, address tok, uint256 amt, , , IMultiSigEscrow.EscrowStatus stat) = escrow.deposits(transferId);
        assertEq(dep, depositor);
        assertEq(ben, beneficiary);
        assertEq(tok, address(cbdc));
        assertEq(amt, 1000e6);
        assertEq(uint256(stat), uint256(IMultiSigEscrow.EscrowStatus.DEPOSITED));
    }

    function test_release_twoOfThreeSignatures() public {
        vm.prank(router);
        escrow.deposit(transferId, depositor, beneficiary, address(cbdc), 1000e6, block.timestamp + 86400);

        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _signRelease(signer1Pk, transferId, beneficiary, address(cbdc), 1000e6, 0);
        sigs[1] = _signRelease(signer2Pk, transferId, beneficiary, address(cbdc), 1000e6, 0);

        escrow.release(transferId, sigs);

        assertEq(cbdc.balanceOf(beneficiary), 1000e6);
        (, , , , , , IMultiSigEscrow.EscrowStatus stat) = escrow.deposits(transferId);
        assertEq(uint256(stat), uint256(IMultiSigEscrow.EscrowStatus.RELEASED));
    }

    function test_release_revertsOnInsufficientSignatures() public {
        vm.prank(router);
        escrow.deposit(transferId, depositor, beneficiary, address(cbdc), 1000e6, block.timestamp + 86400);

        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _signRelease(signer1Pk, transferId, beneficiary, address(cbdc), 1000e6, 0);

        vm.expectRevert(MultiSigEscrow.InsufficientSignatures.selector);
        escrow.release(transferId, sigs);
    }

    function test_release_revertsOnDuplicateSigner() public {
        vm.prank(router);
        escrow.deposit(transferId, depositor, beneficiary, address(cbdc), 1000e6, block.timestamp + 86400);

        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _signRelease(signer1Pk, transferId, beneficiary, address(cbdc), 1000e6, 0);
        sigs[1] = _signRelease(signer1Pk, transferId, beneficiary, address(cbdc), 1000e6, 0); // Duplicate!

        vm.expectRevert(MultiSigEscrow.DuplicateSigner.selector);
        escrow.release(transferId, sigs);
    }

    function test_refund_afterTimelock() public {
        vm.prank(router);
        escrow.deposit(transferId, depositor, beneficiary, address(cbdc), 1000e6, block.timestamp + 86400);

        vm.warp(block.timestamp + 86401);
        vm.prank(router);
        escrow.refund(transferId);

        assertEq(cbdc.balanceOf(depositor), 1000e6);
    }

    function test_refund_revertsDuringTimelock() public {
        vm.prank(router);
        escrow.deposit(transferId, depositor, beneficiary, address(cbdc), 1000e6, block.timestamp + 86400);

        vm.prank(router);
        vm.expectRevert(MultiSigEscrow.RefundTimelockActive.selector);
        escrow.refund(transferId);
    }
}
