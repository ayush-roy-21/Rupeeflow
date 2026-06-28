// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/core/RemittanceRouter.sol";
import "../src/core/MultiSigEscrow.sol";
import "../src/core/FeeController.sol";
import "../src/compliance/AMLModule.sol";
import "../src/compliance/SanctionsList.sol";
import "../src/compliance/RateLimiter.sol";
import "../src/governance/CorridorRegistry.sol";
import "../src/governance/EmergencyGuardian.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address signer1 = vm.envOr("SIGNER_1", deployer);
        address signer2 = vm.envOr("SIGNER_2", address(0x1111111111111111111111111111111111111111));
        address signer3 = vm.envOr("SIGNER_3", address(0x2222222222222222222222222222222222222222));
        uint256 threshold = vm.envOr("ESCROW_THRESHOLD", uint256(2));

        vm.startBroadcast(deployerPrivateKey);

        // 1. FeeController
        FeeController feeController = new FeeController(deployer);

        // 2. SanctionsList
        SanctionsList sanctionsList = new SanctionsList(deployer);

        // 3. AMLModule
        CorridorRegistry corridorRegistry = new CorridorRegistry(deployer);
        AMLModule amlModule = new AMLModule(deployer, address(sanctionsList), address(corridorRegistry));

        // 4. RateLimiter
        RateLimiter rateLimiter = new RateLimiter(deployer);

        // 5. MultiSigEscrow
        address[] memory signers = new address[](3);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        MultiSigEscrow escrow = new MultiSigEscrow(deployer, signers, threshold);

        // 6. EmergencyGuardian
        EmergencyGuardian guardian = new EmergencyGuardian(deployer);

        // 7. RemittanceRouter
        RemittanceRouter router = new RemittanceRouter(
            deployer,
            address(escrow),
            address(feeController),
            address(amlModule),
            address(corridorRegistry),
            address(rateLimiter),
            treasury
        );

        // 8. Post-Deploy Config
        guardian.addControlledContract(address(router));
        router.grantRole(router.GUARDIAN_ROLE(), address(guardian));

        escrow.grantRole(escrow.ROUTER_ROLE(), address(router));
        amlModule.grantRole(amlModule.ROUTER_ROLE(), address(router));
        rateLimiter.grantRole(rateLimiter.ROUTER_ROLE(), address(router));

        vm.stopBroadcast();
    }
}
