// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/compliance/AMLModule.sol";
import "../../src/compliance/SanctionsList.sol";
import "../../src/governance/CorridorRegistry.sol";
import "../mocks/MockCBDC.sol";
import "./AMLHandler.sol";

contract AMLInvariantTest is Test {
    AMLModule public amlModule;
    SanctionsList public sanctionsList;
    CorridorRegistry public corridorRegistry;
    MockCBDC public cbdc;
    AMLHandler public handler;

    function setUp() public {
        address admin = address(0x1);
        vm.startPrank(admin);
        cbdc = new MockCBDC("e-Dollar", "eUSD", 6);
        sanctionsList = new SanctionsList(admin);
        corridorRegistry = new CorridorRegistry(admin);
        amlModule = new AMLModule(admin, address(sanctionsList), address(corridorRegistry));

        bytes32 corridorId = keccak256("US-IN");
        corridorRegistry.registerCorridor(ICorridorRegistry.Corridor({
            id: corridorId, sourceCountry: "US", destCountry: "IN",
            settlementToken: address(cbdc), active: true, minAmount: 10e6,
            maxAmount: 100_000e6, dailyLimit: 1_000_000e6, reportingThreshold: 10_000e6, expiryDuration: 86400
        }));
        vm.stopPrank();

        handler = new AMLHandler(amlModule);
        vm.prank(admin);
        amlModule.grantRole(amlModule.ROUTER_ROLE(), address(handler));

        targetContract(address(handler));
    }

    function invariant_riskScoreBounded() public view {
        for (uint256 i = 0; i < handler.ghost_screenedCount(); i++) {
            uint8 score = handler.ghost_scoreAt(i);
            assertLe(score, 100);
        }
    }
}
