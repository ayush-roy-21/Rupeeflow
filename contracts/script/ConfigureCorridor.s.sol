// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/governance/CorridorRegistry.sol";
import "../src/compliance/RateLimiter.sol";

contract ConfigureCorridorScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address registryAddress = vm.envAddress("CORRIDOR_REGISTRY");
        address rateLimiterAddress = vm.envAddress("RATE_LIMITER");
        address cbdcAddress = vm.envAddress("CBDC_TOKEN");

        require(registryAddress != address(0), "CORRIDOR_REGISTRY env missing");
        require(rateLimiterAddress != address(0), "RATE_LIMITER env missing");
        require(cbdcAddress != address(0), "CBDC_TOKEN env missing");

        CorridorRegistry registry = CorridorRegistry(registryAddress);
        RateLimiter rateLimiter = RateLimiter(rateLimiterAddress);

        vm.startBroadcast(deployerPrivateKey);

        // US-IN Corridor
        bytes32 usInId = keccak256("US-IN");
        registry.registerCorridor(ICorridorRegistry.Corridor({
            id: usInId,
            sourceCountry: "US",
            destCountry: "IN",
            settlementToken: cbdcAddress,
            active: true,
            minAmount: 10e6,
            maxAmount: 10_000e6,
            dailyLimit: 100_000e6,
            reportingThreshold: 5_000e6,
            expiryDuration: 86400
        }));

        rateLimiter.setCorridorRateLimit(usInId, IRateLimiter.RateLimit({
            maxAmount: 100_000e6,
            maxCount: 100,
            windowDuration: 86400,
            cooldownPeriod: 0
        }));

        // AE-IN Corridor (UAE to India)
        bytes32 aeInId = keccak256("AE-IN");
        registry.registerCorridor(ICorridorRegistry.Corridor({
            id: aeInId,
            sourceCountry: "AE",
            destCountry: "IN",
            settlementToken: cbdcAddress,
            active: true,
            minAmount: 10e6,
            maxAmount: 20_000e6,
            dailyLimit: 200_000e6,
            reportingThreshold: 10_000e6,
            expiryDuration: 86400
        }));

        rateLimiter.setCorridorRateLimit(aeInId, IRateLimiter.RateLimit({
            maxAmount: 200_000e6,
            maxCount: 150,
            windowDuration: 86400,
            cooldownPeriod: 0
        }));

        vm.stopBroadcast();
    }
}
