// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/compliance/AMLModule.sol";
import "../../src/compliance/SanctionsList.sol";
import "../../src/governance/CorridorRegistry.sol";
import "../mocks/MockCBDC.sol";

contract AMLModuleTest is Test {
    AMLModule public amlModule;
    SanctionsList public sanctionsList;
    CorridorRegistry public corridorRegistry;
    MockCBDC public cbdc;

    address public admin = address(0x1);
    address public router = address(0x2);
    address public sender = address(0x3);
    address public recipient = address(0x4);

    bytes32 public corridorId = keccak256("US-IN");

    function setUp() public {
        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);
        sanctionsList = new SanctionsList(admin);
        corridorRegistry = new CorridorRegistry(admin);
        amlModule = new AMLModule(admin, address(sanctionsList), address(corridorRegistry));
        amlModule.grantRole(amlModule.ROUTER_ROLE(), router);

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
        vm.stopPrank();
    }

    function test_screenTransaction_cleanPass() public {
        vm.prank(router);
        (uint8 score, bool flagged) = amlModule.screenTransaction(sender, recipient, 100e6, corridorId);
        assertFalse(flagged);
        assertLe(score, 50);
    }

    function test_screenTransaction_sanctionedReverts() public {
        address[] memory toAdd = new address[](1);
        toAdd[0] = sender;
        address[] memory empty = new address[](0);

        vm.prank(admin);
        sanctionsList.updateSanctionsList(toAdd, empty);

        vm.prank(router);
        vm.expectRevert(AMLModule.SanctionedAddress.selector);
        amlModule.screenTransaction(sender, recipient, 100e6, corridorId);
    }

    function test_flagWalletCluster_success() public {
        address[] memory wallets = new address[](2);
        wallets[0] = address(0xA);
        wallets[1] = address(0xB);

        vm.prank(admin);
        amlModule.flagWalletCluster(wallets, keccak256("Sybil Ring"));

        assertEq(amlModule.getWalletRiskScore(address(0xA)), 85);
        assertEq(amlModule.getWalletRiskScore(address(0xB)), 85);
    }

    function test_screenTransaction_flaggedCluster() public {
        address[] memory wallets = new address[](1);
        wallets[0] = sender;

        vm.prank(admin);
        amlModule.flagWalletCluster(wallets, keccak256("Suspicious"));

        vm.prank(router);
        (, bool flagged) = amlModule.screenTransaction(sender, recipient, 100e6, corridorId);
        assertTrue(flagged);
    }
}
