// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./BaseFork.t.sol";
import "../../src/core/RemittanceRouter.sol";
import "../../src/core/MultiSigEscrow.sol";
import "../../src/core/FeeController.sol";
import "../../src/compliance/AMLModule.sol";
import "../../src/compliance/SanctionsList.sol";
import "../../src/compliance/RateLimiter.sol";
import "../../src/governance/CorridorRegistry.sol";

contract CBDCForkTest is BaseForkTest {
    RemittanceRouter public router;
    MultiSigEscrow public escrow;
    FeeController public feeController;
    AMLModule public amlModule;
    SanctionsList public sanctionsList;
    RateLimiter public rateLimiter;
    CorridorRegistry public corridorRegistry;

    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public sender = address(0x3);
    address public recipient = address(0x4);

    uint256 public signer1Pk = 0xA11CE;
    address public signer1;
    bytes32 public corridorId = keccak256("US-IN");

    function setUp() public override {
        super.setUp();
        signer1 = vm.addr(signer1Pk);

        vm.startPrank(admin);
        feeController = new FeeController(admin);
        sanctionsList = new SanctionsList(admin);
        corridorRegistry = new CorridorRegistry(admin);
        amlModule = new AMLModule(admin, address(sanctionsList), address(corridorRegistry));
        rateLimiter = new RateLimiter(admin);

        address[] memory signers = new address[](1);
        signers[0] = signer1;
        escrow = new MultiSigEscrow(admin, signers, 1);

        router = new RemittanceRouter(
            admin, address(escrow), address(feeController), address(amlModule),
            address(corridorRegistry), address(rateLimiter), treasury
        );

        escrow.grantRole(escrow.ROUTER_ROLE(), address(router));
        amlModule.grantRole(amlModule.ROUTER_ROLE(), address(router));
        rateLimiter.grantRole(rateLimiter.ROUTER_ROLE(), address(router));

        corridorRegistry.registerCorridor(ICorridorRegistry.Corridor({
            id: corridorId, sourceCountry: "US", destCountry: "IN",
            settlementToken: address(cbdcToken), active: true, minAmount: 10e6,
            maxAmount: 100_000e6, dailyLimit: 1_000_000e6, reportingThreshold: 10_000e6, expiryDuration: 86400
        }));

        rateLimiter.setCorridorRateLimit(corridorId, IRateLimiter.RateLimit({
            maxAmount: 100_000e6, maxCount: 100, windowDuration: 86400, cooldownPeriod: 0
        }));
        vm.stopPrank();

        _dealCBDC(sender, 10_000e6);
        vm.prank(sender);
        cbdcToken.approve(address(router), type(uint256).max);
    }

    function _signRelease(uint256 pk, bytes32 txId, address ben, address token, uint256 amt, uint256 nonce) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(escrow.RELEASE_TYPEHASH(), txId, ben, token, amt, nonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", escrow.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_fork_realCBDCTransfer() public {
        vm.prank(sender);
        bytes32 txId = router.initiateTransfer(recipient, 1000e6, corridorId, "");

        IRemittanceRouter.Transfer memory t = router.getTransfer(txId);
        assertEq(cbdcToken.balanceOf(address(escrow)), t.netAmount);

        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _signRelease(signer1Pk, txId, recipient, address(cbdcToken), t.netAmount, 0);

        router.completeTransfer(txId, sigs);
        assertEq(cbdcToken.balanceOf(recipient), t.netAmount);
    }
}
