const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying RupeeFlow smart contract...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId);

  // Deploy mock contracts for testing (replace with real addresses in production)
  console.log("\n🔨 Deploying mock contracts...");
  
  // Mock Treasury
  const MockTreasury = await ethers.getContractFactory("MockTreasury");
  const mockTreasury = await MockTreasury.deploy();
  await mockTreasury.waitForDeployment();
  console.log("✅ Mock Treasury deployed to:", await mockTreasury.getAddress());

  // Mock FX Oracle
  const MockFXOracle = await ethers.getContractFactory("MockFXOracle");
  const mockFXOracle = await MockFXOracle.deploy();
  await mockFXOracle.waitForDeployment();
  console.log("✅ Mock FX Oracle deployed to:", await mockFXOracle.getAddress());

  // Mock On-Ramp Provider
  const MockOnRampProvider = await ethers.getContractFactory("MockOnRampProvider");
  const mockOnRampProvider = await MockOnRampProvider.deploy();
  await mockOnRampProvider.waitForDeployment();
  console.log("✅ Mock On-Ramp Provider deployed to:", await mockOnRampProvider.getAddress());

  // Mock Off-Ramp Provider
  const MockOffRampProvider = await ethers.getContractFactory("MockOffRampProvider");
  const mockOffRampProvider = await MockOffRampProvider.deploy();
  await mockOffRampProvider.waitForDeployment();
  console.log("✅ Mock Off-Ramp Provider deployed to:", await mockOffRampProvider.getAddress());

  // Deploy RupeeFlow contract
  console.log("\n🚀 Deploying RupeeFlow contract...");
  const RupeeFlow = await ethers.getContractFactory("RupeeFlow");
  const rupeeFlow = await RupeeFlow.deploy(
    await mockTreasury.getAddress(),
    await mockFXOracle.getAddress(),
    await mockOnRampProvider.getAddress(),
    await mockOffRampProvider.getAddress()
  );
  await rupeeFlow.waitForDeployment();
  console.log("✅ RupeeFlow deployed to:", await rupeeFlow.getAddress());

  // Deploy mock stablecoins for testing
  console.log("\n🪙 Deploying mock stablecoins...");
  
  // Mock USDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC");
  await mockUSDC.waitForDeployment();
  console.log("✅ Mock USDC deployed to:", await mockUSDC.getAddress());

  // Mock USDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy("Tether USD", "USDT");
  await mockUSDT.waitForDeployment();
  console.log("✅ Mock USDT deployed to:", await mockUSDT.getAddress());

  // Add stablecoins to RupeeFlow
  console.log("\n🔗 Adding stablecoins to RupeeFlow...");
  
  const addUSDC = await rupeeFlow.addStablecoin(await mockUSDC.getAddress(), "USDC");
  await addUSDC.wait();
  console.log("✅ USDC added to RupeeFlow");

  const addUSDT = await rupeeFlow.addStablecoin(await mockUSDT.getAddress(), "USDT");
  await addUSDT.wait();
  console.log("✅ USDT added to RupeeFlow");

  // Mint some tokens to deployer for testing
  console.log("\n💰 Minting test tokens...");
  
  const mintUSDC = await mockUSDC.mint(deployer.address, ethers.parseUnits("10000", 6));
  await mintUSDC.wait();
  console.log("✅ 10,000 USDC minted to deployer");

  const mintUSDT = await mockUSDT.mint(deployer.address, ethers.parseUnits("10000", 6));
  await mintUSDT.wait();
  console.log("✅ 10,000 USDT minted to deployer");

  // Print deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("📋 Contract Addresses:");
  console.log("   RupeeFlow:", await rupeeFlow.getAddress());
  console.log("   Mock Treasury:", await mockTreasury.getAddress());
  console.log("   Mock FX Oracle:", await mockFXOracle.getAddress());
  console.log("   Mock On-Ramp:", await mockOnRampProvider.getAddress());
  console.log("   Mock Off-Ramp:", await mockOffRampProvider.getAddress());
  console.log("   Mock USDC:", await mockUSDC.getAddress());
  console.log("   Mock USDT:", await mockUSDT.getAddress());
  console.log("\n🔗 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId);
  console.log("🔗 Deployer:", deployer.address);
  console.log("=".repeat(60));

  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    contracts: {
      RupeeFlow: await rupeeFlow.getAddress(),
      MockTreasury: await mockTreasury.getAddress(),
      MockFXOracle: await mockFXOracle.getAddress(),
      MockOnRampProvider: await mockOnRampProvider.getAddress(),
      MockOffRampProvider: await mockOffRampProvider.getAddress(),
      MockUSDC: await mockUSDC.getAddress(),
      MockUSDT: await mockUSDT.getAddress()
    },
    timestamp: new Date().toISOString()
  };

  const fs = require("fs");
  const deploymentPath = `./deployments/${network.name}-${network.chainId}.json`;
  
  // Ensure deployments directory exists
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments", { recursive: true });
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  // Verify contracts on block explorer (if not localhost)
  if (network.chainId !== 1337 && network.chainId !== 31337) {
    console.log("\n🔍 Verifying contracts on block explorer...");
    console.log("   Run: npx hardhat verify --network", network.name);
    console.log("   RupeeFlow:", await rupeeFlow.getAddress());
    console.log("   Args:", [
      await mockTreasury.getAddress(),
      await mockFXOracle.getAddress(),
      await mockOnRampProvider.getAddress(),
      await mockOffRampProvider.getAddress()
    ].join(", "));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
