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

contract RemittanceRouterTest is Test {
    RemittanceRouter public router;
    MultiSigEscrow public escrow;
    FeeController public feeController;
    AMLModule public amlModule;
    SanctionsList public sanctionsList;
    RateLimiter public rateLimiter;
    CorridorRegistry public corridorRegistry;
    EmergencyGuardian public guardian;
    MockCBDC public cbdc;

    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public sender = address(0x3);
    address public recipient = address(0x4);

    uint256 public signer1Pk = 0xA11CE;
    uint256 public signer2Pk = 0xB0B;
    uint256 public signer3Pk = 0xC0D3;
    address public signer1;
    address public signer2;
    address public signer3;

    bytes32 public corridorId;

    function setUp() public {
        signer1 = vm.addr(signer1Pk);
        signer2 = vm.addr(signer2Pk);
        signer3 = vm.addr(signer3Pk);

        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);

        feeController = new FeeController(admin);
        sanctionsList = new SanctionsList(admin);
        corridorRegistry = new CorridorRegistry(admin);
        amlModule = new AMLModule(admin, address(sanctionsList), address(corridorRegistry));
        rateLimiter = new RateLimiter(admin);

        address[] memory signers = new address[](3);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        escrow = new MultiSigEscrow(admin, signers, 2);

        router = new RemittanceRouter(
            admin,
            address(escrow),
            address(feeController),
            address(amlModule),
            address(corridorRegistry),
            address(rateLimiter),
            treasury
        );

        guardian = new EmergencyGuardian(admin);
        guardian.addControlledContract(address(router));
        router.grantRole(router.GUARDIAN_ROLE(), address(guardian));

        // Grant ROUTER_ROLE to router across modules
        escrow.grantRole(escrow.ROUTER_ROLE(), address(router));
        amlModule.grantRole(amlModule.ROUTER_ROLE(), address(router));
        rateLimiter.grantRole(rateLimiter.ROUTER_ROLE(), address(router));

        // Register corridor US-IN
        corridorId = keccak256(abi.encodePacked("US", "-", "IN"));
        corridorRegistry.registerCorridor(ICorridorRegistry.Corridor({
            id: corridorId,
            sourceCountry: "US",
            destCountry: "IN",
            settlementToken: address(cbdc),
            active: true,
            minAmount: 10e6,
            maxAmount: 10_000e6,
            dailyLimit: 100_000e6,
            reportingThreshold: 5_000e6,
            expiryDuration: 86400
        }));

        // Set rate limits
        rateLimiter.setCorridorRateLimit(corridorId, IRateLimiter.RateLimit({
            maxAmount: 10_000e6,
            maxCount: 20,
            windowDuration: 86400,
            cooldownPeriod: 0
        }));

        vm.stopPrank();

        cbdc.mint(sender, 50_000e6);
        vm.prank(sender);
        cbdc.approve(address(router), type(uint256).max);
    }

    function test_initiateTransfer_success() public {
        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 100e6, corridorId, "");

        IRemittanceRouter.Transfer memory t = router.getTransfer(txId);
        assertEq(t.sender, sender);
        assertEq(t.recipient, recipient);
        assertEq(t.amount, 100e6);
        assertEq(uint256(t.status), uint256(IRemittanceRouter.TransferStatus.INITIATED));

        // Fee is 0.30% = 0.3e6. Net amount = 99.7e6
        assertEq(cbdc.balanceOf(treasury), t.fee);
        assertEq(cbdc.balanceOf(address(escrow)), t.netAmount);
    }

    function test_initiateTransfer_revertsOnZeroAmount() public {
        vm.prank(sender);
        vm.expectRevert(RemittanceRouter.InvalidAmount.selector);
        router.initiateTransfer(recipient, 0, corridorId, "");
    }

    function test_initiateTransfer_revertsOnZeroRecipient() public {
        vm.prank(sender);
        vm.expectRevert(RemittanceRouter.InvalidRecipient.selector);
        router.initiateTransfer(address(0), 100e6, corridorId, "");
    }

    function test_initiateTransfer_revertsOnInactiveCorridor() public {
        vm.prank(admin);
        corridorRegistry.deactivateCorridor(corridorId);

        vm.prank(sender);
        vm.expectRevert(RemittanceRouter.InvalidCorridor.selector);
        router.initiateTransfer(recipient, 100e6, corridorId, "");
    }

    function test_initiateTransfer_revertsWhenPaused() public {
        vm.prank(admin);
        guardian.emergencyPause();

        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        router.initiateTransfer(recipient, 100e6, corridorId, "");
    }

    function test_cancelTransfer_success() public {
        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 100e6, corridorId, "");

        uint256 balBefore = cbdc.balanceOf(sender);
        vm.prank(sender);
        router.cancelTransfer(txId);

        IRemittanceRouter.Transfer memory t = router.getTransfer(txId);
        assertEq(uint256(t.status), uint256(IRemittanceRouter.TransferStatus.CANCELLED));
        assertEq(cbdc.balanceOf(sender), balBefore + t.netAmount);
    }

    function test_cancelTransfer_revertsOnUnauthorized() public {
        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 100e6, corridorId, "");

        vm.prank(address(0x999));
        vm.expectRevert(RemittanceRouter.UnauthorizedCaller.selector);
        router.cancelTransfer(txId);
    }

    function test_rejectTransfer_operatorOnly() public {
        // Amount >= reporting threshold flags transaction
        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 5_000e6, corridorId, "");

        IRemittanceRouter.Transfer memory t = router.getTransfer(txId);
        assertEq(uint256(t.status), uint256(IRemittanceRouter.TransferStatus.FLAGGED));

        vm.prank(admin); // admin has OPERATOR_ROLE
        router.rejectTransfer(txId, keccak256("AML Risk"));

        t = router.getTransfer(txId);
        assertEq(uint256(t.status), uint256(IRemittanceRouter.TransferStatus.REJECTED));
    }
}
