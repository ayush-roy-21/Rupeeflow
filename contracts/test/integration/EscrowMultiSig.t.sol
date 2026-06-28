// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/core/MultiSigEscrow.sol";
import "../mocks/MockCBDC.sol";

contract EscrowMultiSigTest is Test {
    MultiSigEscrow public escrow;
    MockCBDC public cbdc;

    address public admin = address(0x1);
    address public router = address(0x2);
    address public depositor = address(0x3);
    address public beneficiary = address(0x4);

    uint256 public signer1Pk = 0x111;
    uint256 public signer2Pk = 0x222;
    uint256 public signer3Pk = 0x333;
    address public signer1;
    address public signer2;
    address public signer3;

    function setUp() public {
        signer1 = vm.addr(signer1Pk);
        signer2 = vm.addr(signer2Pk);
        signer3 = vm.addr(signer3Pk);

        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);
        address[] memory signers = new address[](3);
        signers[0] = signer1; signers[1] = signer2; signers[2] = signer3;
        escrow = new MultiSigEscrow(admin, signers, 2);
        escrow.grantRole(escrow.ROUTER_ROLE(), router);
        vm.stopPrank();

        cbdc.mint(router, 10_000e6);
        vm.prank(router);
        cbdc.approve(address(escrow), type(uint256).max);
    }

    function _signRelease(uint256 pk, bytes32 txId, address ben, address token, uint256 amt, uint256 nonce) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(escrow.RELEASE_TYPEHASH(), txId, ben, token, amt, nonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", escrow.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_signerRotation() public {
        bytes32 txId = keccak256("TX_ROTATION");
        vm.prank(router);
        escrow.deposit(txId, depositor, beneficiary, address(cbdc), 1000e6, block.timestamp + 86400);

        uint256 newSignerPk = 0x999;
        address newSigner = vm.addr(newSignerPk);
        address[] memory newSigners = new address[](1);
        newSigners[0] = newSigner;

        vm.prank(admin);
        escrow.updateSigners(newSigners, 1);

        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _signRelease(newSignerPk, txId, beneficiary, address(cbdc), 1000e6, 0);

        escrow.release(txId, sigs);
        assertEq(cbdc.balanceOf(beneficiary), 1000e6);
    }
}
