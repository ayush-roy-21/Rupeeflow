// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/core/RemittanceRouter.sol";
import "../../src/core/MultiSigEscrow.sol";
import "../../src/core/FeeController.sol";
import "../../src/compliance/AMLModule.sol";
import "../../src/compliance/SanctionsList.sol";
import "../../src/compliance/RateLimiter.sol";
import "../../src/governance/CorridorRegistry.sol";
import "../../src/governance/EmergencyGuardian.sol";
import "../mocks/MockCBDC.sol";

contract TransferLifecycleTest is Test {
    RemittanceRouter public router;
    MultiSigEscrow public escrow;
    FeeController public feeController;
    AMLModule public amlModule;
    SanctionsList public sanctionsList;
    RateLimiter public rateLimiter;
    CorridorRegistry public corridorRegistry;
    MockCBDC public cbdc;

    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public sender = address(0x3);
    address public recipient = address(0x4);

    uint256 public signer1Pk = 0xA11CE;
    uint256 public signer2Pk = 0xB0B;
    address public signer1;
    address public signer2;

    bytes32 public corridorId = keccak256("US-IN");

    function setUp() public {
        signer1 = vm.addr(signer1Pk);
        signer2 = vm.addr(signer2Pk);

        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);
        feeController = new FeeController(admin);
        sanctionsList = new SanctionsList(admin);
        corridorRegistry = new CorridorRegistry(admin);
        amlModule = new AMLModule(admin, address(sanctionsList), address(corridorRegistry));
        rateLimiter = new RateLimiter(admin);

        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;
        escrow = new MultiSigEscrow(admin, signers, 2);

        router = new RemittanceRouter(
            admin, address(escrow), address(feeController), address(amlModule),
            address(corridorRegistry), address(rateLimiter), treasury
        );

        escrow.grantRole(escrow.ROUTER_ROLE(), address(router));
        amlModule.grantRole(amlModule.ROUTER_ROLE(), address(router));
        rateLimiter.grantRole(rateLimiter.ROUTER_ROLE(), address(router));

        corridorRegistry.registerCorridor(ICorridorRegistry.Corridor({
            id: corridorId, sourceCountry: "US", destCountry: "IN",
            settlementToken: address(cbdc), active: true, minAmount: 10e6,
            maxAmount: 100_000e6, dailyLimit: 1_000_000e6, reportingThreshold: 10_000e6, expiryDuration: 86400
        }));

        rateLimiter.setCorridorRateLimit(corridorId, IRateLimiter.RateLimit({
            maxAmount: 100_000e6, maxCount: 100, windowDuration: 86400, cooldownPeriod: 0
        }));
        vm.stopPrank();

        cbdc.mint(sender, 500_000e6);
        vm.prank(sender);
        cbdc.approve(address(router), type(uint256).max);
    }

    function _signRelease(uint256 pk, bytes32 txId, address ben, address token, uint256 amt, uint256 nonce) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(escrow.RELEASE_TYPEHASH(), txId, ben, token, amt, nonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", escrow.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_lifecycle_initiateAndComplete() public {
        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 1000e6, corridorId, "");

        IRemittanceRouter.Transfer memory t = router.getTransfer(txId);
        assertEq(cbdc.balanceOf(address(escrow)), t.netAmount);

        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _signRelease(signer1Pk, txId, recipient, address(cbdc), t.netAmount, 0);
        sigs[1] = _signRelease(signer2Pk, txId, recipient, address(cbdc), t.netAmount, 0);

        router.completeTransfer(txId, sigs);
        assertEq(cbdc.balanceOf(recipient), t.netAmount);
    }

    function test_lifecycle_expiryRefund() public {
        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 1000e6, corridorId, "");

        IRemittanceRouter.Transfer memory t = router.getTransfer(txId);
        uint256 senderBalBefore = cbdc.balanceOf(sender);

        vm.warp(t.expiresAt + 1);
        vm.prank(sender);
        router.claimRefund(txId);

        assertEq(cbdc.balanceOf(sender), senderBalBefore + t.netAmount);
    }
}
