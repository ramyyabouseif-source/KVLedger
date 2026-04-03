/**
 * Deployment Script for LoanRegistry
 * 
 * This script:
 * 1. Deploys the contract to specified network
 * 2. Verifies deployment
 * 3. Creates a few sample loans for testing
 * 4. Shows you how to interact with the contract
 */

const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 DEPLOYING LOANREGISTRY CONTRACT");
  console.log("=".repeat(60) + "\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("");

  // Deploy the contract
  console.log("⏳ Deploying LoanRegistry contract...");
  const LoanRegistry = await hre.ethers.getContractFactory("LoanRegistry");
  const loanRegistry = await LoanRegistry.deploy();
  
  await loanRegistry.waitForDeployment();
  const contractAddress = await loanRegistry.getAddress();

  console.log("✅ LoanRegistry deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("👤 Admin address:", await loanRegistry.admin());
  console.log("📊 Initial loan count:", (await loanRegistry.loanCount()).toString());
  
  console.log("\n" + "=".repeat(60));
  console.log("📝 CREATING SAMPLE LOANS");
  console.log("=".repeat(60) + "\n");

  // Create sample loans for testing
  const sampleLoans = [
    {
      name: "Maria Santos",
      hash: hre.ethers.id("borrower-maria-santos"),
      amount: 10000, // $100.00
      duration: 180,
      currency: "USD",
    },
    {
      name: "John Omondi",
      hash: hre.ethers.id("borrower-john-omondi"),
      amount: 15000, // $150.00
      duration: 180,
      currency: "USD",
    },
    {
      name: "Amina Ibrahim",
      hash: hre.ethers.id("borrower-amina-ibrahim"),
      amount: 20000, // $200.00
      duration: 180,
      currency: "USD",
    },
  ];

  for (let i = 0; i < sampleLoans.length; i++) {
    const loan = sampleLoans[i];
    console.log(`⏳ Creating loan ${i + 1}/${sampleLoans.length} for ${loan.name}...`);
    
    const tx = await loanRegistry.createLoan(
      loan.hash,
      loan.amount,
      loan.duration,
      loan.currency
    );
    const receipt = await tx.wait();
    
    console.log(`   ✅ Loan ID: ${i}`);
    console.log(`   💵 Amount: $${(loan.amount / 100).toFixed(2)}`);
    console.log(`   📅 Duration: ${loan.duration} days`);
    console.log(`   🔗 Transaction: ${receipt.hash}`);
    console.log("");
  }

  const totalLoans = await loanRegistry.getTotalLoans();
  console.log("📊 Total loans created:", totalLoans.toString());

  console.log("\n" + "=".repeat(60));
  console.log("🎯 TESTING CONTRACT FUNCTIONS");
  console.log("=".repeat(60) + "\n");

  // Get details of first loan
  console.log("📖 Getting details of Loan #0...");
  const loan0 = await loanRegistry.getLoanDetails(0);
  console.log("   Borrower Hash:", loan0.borrowerHash);
  console.log("   Amount:", hre.ethers.formatUnits(loan0.amountInCents, 2), loan0.currency);
  console.log("   Status:", loan0.status === 0n ? "Active" : loan0.status === 1n ? "Completed" : "Defaulted");
  console.log("   Total Repaid:", hre.ethers.formatUnits(loan0.totalRepaid, 2), loan0.currency);
  console.log("");

  // Record a repayment
  console.log("💸 Recording a repayment of $25.00 for Loan #0...");
  const repaymentTx = await loanRegistry.recordRepayment(0, 2500, "First monthly payment");
  await repaymentTx.wait();
  console.log("   ✅ Repayment recorded!");
  
  // Get updated loan details
  const updatedLoan = await loanRegistry.getLoanDetails(0);
  console.log("   💰 New total repaid:", hre.ethers.formatUnits(updatedLoan.totalRepaid, 2), "USD");
  
  // Get remaining balance
  const remaining = await loanRegistry.getRemainingBalance(0);
  console.log("   📊 Remaining balance:", hre.ethers.formatUnits(remaining, 2), "USD");
  console.log("");

  // Get repayment history
  console.log("📜 Repayment history for Loan #0:");
  const history = await loanRegistry.getRepaymentHistory(0);
  history.forEach((repayment, index) => {
    console.log(`   Payment ${index + 1}: $${hre.ethers.formatUnits(repayment.amount, 2)} - "${repayment.notes}"`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60) + "\n");

  console.log("🔧 INTERACTION COMMANDS:");
  console.log("------------------------\n");
  
  console.log("To interact with your contract via Hardhat console:\n");
  console.log("  npx hardhat console --network localhost\n");
  
  console.log("Then in the console, run:\n");
  console.log(`  const LoanRegistry = await ethers.getContractFactory("LoanRegistry")`);
  console.log(`  const loan = await LoanRegistry.attach("${contractAddress}")`);
  console.log(`  await loan.getTotalLoans()`);
  console.log(`  await loan.getLoanDetails(0)`);
  console.log(`  await loan.recordRepayment(0, 2500, "Payment 2")`);
  
  console.log("\n" + "=".repeat(60) + "\n");

  // Save deployment info to a file for reference
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    sampleLoans: sampleLoans.length,
  };

  console.log("📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });