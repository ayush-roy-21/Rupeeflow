// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/core/FeeController.sol";

contract FeeControllerTest is Test {
    FeeController public feeController;
    address public admin = address(0x1);
    address public sender = address(0x2);
    bytes32 public corridorId = keccak256("US-IN");

    function setUp() public {
        vm.prank(admin);
        feeController = new FeeController(admin);
    }

    function test_calculateFee_baseFee() public {
        (uint256 fee, uint256 netAmount) = feeController.calculateFee(sender, 10_000e6, corridorId);
        // Base rate is 30 bps (0.30%). 10,000 * 30 / 10000 = 30
        assertEq(fee, 30e6);
        assertEq(netAmount, 9_970e6);
    }

    function test_calculateFee_corridorOverride() public {
        vm.prank(admin);
        feeController.setCorridorFee(corridorId, 15); // 0.15%

        (uint256 fee, uint256 netAmount) = feeController.calculateFee(sender, 10_000e6, corridorId);
        assertEq(fee, 15e6);
        assertEq(netAmount, 9_985e6);
    }

    function test_calculateFee_tierDiscount() public {
        IFeeController.FeeTier[] memory tiers = new IFeeController.FeeTier[](2);
        tiers[0] = IFeeController.FeeTier({minVolume: 50_000e6, feeRate: 20}); // 0.20%
        tiers[1] = IFeeController.FeeTier({minVolume: 100_000e6, feeRate: 10}); // 0.10%

        vm.prank(admin);
        feeController.setFeeTiers(tiers);

        feeController.recordVolume(sender, 120_000e6);

        (uint256 fee, ) = feeController.calculateFee(sender, 10_000e6, corridorId);
        assertEq(fee, 10e6); // Qualifies for 10 bps tier
    }

    function test_calculateFee_feeCapEnforced() public {
        vm.prank(admin);
        vm.expectRevert(FeeController.FeeExceedsMax.selector);
        feeController.setBaseFeeRate(501); // Over 500 bps cap
    }

    function testFuzz_calculateFee_neverExceedsMax(uint256 amount) public {
        vm.assume(amount > 0 && amount < 1e18);
        (uint256 fee, ) = feeController.calculateFee(sender, amount, corridorId);
        assertLe(fee, (amount * 500) / 10000);
    }
}
