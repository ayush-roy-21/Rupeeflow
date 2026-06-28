// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../mocks/MockCBDC.sol";

abstract contract BaseForkTest is Test {
    uint256 baseFork;
    IERC20 public cbdcToken;
    bool public isForked;

    function setUp() public virtual {
        string memory rpcUrl;
        try vm.envString("BASE_RPC_URL") returns (string memory url) {
            rpcUrl = url;
        } catch {
            rpcUrl = "";
        }

        if (bytes(rpcUrl).length > 0) {
            baseFork = vm.createFork(rpcUrl);
            vm.selectFork(baseFork);
            // On Base mainnet, USDC/CBDC address
            cbdcToken = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
            isForked = true;
        } else {
            // Offline fallback simulation
            MockCBDC mock = new MockCBDC("Fork CBDC", "fCBDC", 6);
            cbdcToken = IERC20(address(mock));
            isForked = false;
        }
    }

    function _dealCBDC(address to, uint256 amount) internal {
        if (isForked) {
            deal(address(cbdcToken), to, amount);
        } else {
            MockCBDC(address(cbdcToken)).mint(to, amount);
        }
    }
}
