// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/compliance/RateLimiter.sol";

contract RateLimiterTest is Test {
    RateLimiter public rateLimiter;
    address public admin = address(0x1);
    address public router = address(0x2);
    address public sender = address(0x3);
    bytes32 public corridorId = keccak256("US-IN");

    function setUp() public {
        vm.startPrank(admin);
        rateLimiter = new RateLimiter(admin);
        rateLimiter.grantRole(rateLimiter.ROUTER_ROLE(), router);

        rateLimiter.setCorridorRateLimit(corridorId, IRateLimiter.RateLimit({
            maxAmount: 1_000e6,
            maxCount: 2,
            windowDuration: 3600,
            cooldownPeriod: 60
        }));
        vm.stopPrank();
    }

    function test_checkRateLimit_firstTransferPasses() public {
        assertTrue(rateLimiter.checkRateLimit(sender, 500e6, corridorId));
    }

    function test_checkRateLimit_cooldownEnforced() public {
        vm.prank(router);
        rateLimiter.recordTransfer(sender, 100e6, corridorId);

        vm.warp(block.timestamp + 30); // 30s elapsed, cooldown is 60s
        assertFalse(rateLimiter.checkRateLimit(sender, 100e6, corridorId));
    }

    function test_checkRateLimit_countLimitExceeded() public {
        vm.prank(router);
        rateLimiter.recordTransfer(sender, 100e6, corridorId);
        
        vm.warp(block.timestamp + 61);
        vm.prank(router);
        rateLimiter.recordTransfer(sender, 100e6, corridorId);

        vm.warp(block.timestamp + 61);
        // Max count is 2. Third transfer within window should fail
        assertFalse(rateLimiter.checkRateLimit(sender, 100e6, corridorId));
    }

    function test_checkRateLimit_windowReset() public {
        vm.prank(router);
        rateLimiter.recordTransfer(sender, 1_000e6, corridorId);

        vm.warp(block.timestamp + 3601); // Past window duration
        assertTrue(rateLimiter.checkRateLimit(sender, 500e6, corridorId));
    }
}
