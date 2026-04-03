/**
 * Simple Loan Creation Script
 * 
 * This script allows you to create loans directly without MetaMask
 * Usage: node scripts/createLoan.js
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("💰 CREATING A NEW LOAN");
  console.log("=".repeat(60) + "\n");

  // Get the contract
  const LoanRegistry = await ethers.getContractFactory("LoanRegistry");
  const loanRegistry = await LoanRegistry.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Loan parameters (you can modify these)
  const borrowerId = "john-doe-001";
  const borrowerHash = ethers.id(`borrower-${borrowerId}`);
  const amountInCents = 10000; // $100.00
  const durationDays = 180;
  const currency = "USD";

  console.log("📝 Loan Details:");
  console.log(`   Borrower ID: ${borrowerId}`);
  console.log(`   Borrower Hash: ${borrowerHash}`);
  console.log(`   Amount: $${(amountInCents / 100).toFixed(2)}`);
  console.log(`   Duration: ${durationDays} days`);
  console.log(`   Currency: ${currency}`);
  console.log("");

  // Create the loan
  console.log("⏳ Creating loan...");
  const tx = await loanRegistry.createLoan(
    borrowerHash,
    amountInCents,
    durationDays,
    currency
  );

  console.log(`🔗 Transaction submitted: ${tx.hash}`);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

  // Get the loan ID from the transaction logs
  const loanCreatedEvent = receipt.logs.find(log => {
    try {
      const parsed = loanRegistry.interface.parseLog(log);
      return parsed.name === "LoanCreated";
    } catch (e) {
      return false;
    }
  });

  if (loanCreatedEvent) {
    const parsed = loanRegistry.interface.parseLog(loanCreatedEvent);
    const loanId = parsed.args.loanId;
    console.log(`🎉 Loan created successfully! Loan ID: ${loanId}`);
  }

  // Get updated loan count
  const totalLoans = await loanRegistry.getTotalLoans();
  console.log(`📊 Total loans in system: ${totalLoans}`);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 LOAN CREATION COMPLETE!");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error creating loan:");
    console.error(error);
    process.exit(1);
  });

