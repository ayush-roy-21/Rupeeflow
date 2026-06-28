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
import "../mocks/MockCBDC.sol";

contract AMLIntegrationTest is Test {
    RemittanceRouter public router;
    MultiSigEscrow public escrow;
    FeeController public feeController;
    AMLModule public amlModule;
    SanctionsList public sanctionsList;
    RateLimiter public rateLimiter;
    CorridorRegistry public corridorRegistry;
    MockCBDC public cbdc;

    address public admin = address(0x1);
    address public sender = address(0x2);
    address public recipient = address(0x3);

    bytes32 public corridorId = keccak256("US-IN");

    function setUp() public {
        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);
        feeController = new FeeController(admin);
        sanctionsList = new SanctionsList(admin);
        corridorRegistry = new CorridorRegistry(admin);
        amlModule = new AMLModule(admin, address(sanctionsList), address(corridorRegistry));
        rateLimiter = new RateLimiter(admin);

        address[] memory signers = new address[](1);
        signers[0] = admin;
        escrow = new MultiSigEscrow(admin, signers, 1);

        router = new RemittanceRouter(
            admin, address(escrow), address(feeController), address(amlModule),
            address(corridorRegistry), address(rateLimiter), admin
        );

        escrow.grantRole(escrow.ROUTER_ROLE(), address(router));
        amlModule.grantRole(amlModule.ROUTER_ROLE(), address(router));
        rateLimiter.grantRole(rateLimiter.ROUTER_ROLE(), address(router));

        corridorRegistry.registerCorridor(ICorridorRegistry.Corridor({
            id: corridorId, sourceCountry: "US", destCountry: "IN",
            settlementToken: address(cbdc), active: true, minAmount: 10e6,
            maxAmount: 100_000e6, dailyLimit: 1_000_000e6, reportingThreshold: 5_000e6, expiryDuration: 86400
        }));

        rateLimiter.setCorridorRateLimit(corridorId, IRateLimiter.RateLimit({
            maxAmount: 100_000e6, maxCount: 5, windowDuration: 86400, cooldownPeriod: 0
        }));
        vm.stopPrank();

        cbdc.mint(sender, 500_000e6);
        vm.prank(sender);
        cbdc.approve(address(router), type(uint256).max);
    }

    function test_amlCluster_blocking() public {
        address[] memory cluster = new address[](1);
        cluster[0] = sender;

        vm.prank(admin);
        amlModule.flagWalletCluster(cluster, keccak256("Sybil"));

        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 100e6, corridorId, "");

        IRemittanceRouter.Transfer memory t = router.getTransfer(txId);
        assertEq(uint256(t.status), uint256(IRemittanceRouter.TransferStatus.FLAGGED));
    }
}
