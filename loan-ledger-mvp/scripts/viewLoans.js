/**
 * Loan Viewing Script
 * 
 * This script allows you to view all loans in the system
 * Usage: node scripts/viewLoans.js
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("📋 VIEWING ALL LOANS");
  console.log("=".repeat(60) + "\n");

  // Get the contract
  const LoanRegistry = await ethers.getContractFactory("LoanRegistry");
  const loanRegistry = await LoanRegistry.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Get total loan count
  const totalLoans = await loanRegistry.getTotalLoans();
  console.log(`📊 Total loans in system: ${totalLoans}\n`);

  if (totalLoans === 0n) {
    console.log("No loans found in the system.");
    return;
  }

  // Display each loan
  for (let i = 0; i < totalLoans; i++) {
    console.log(`📝 Loan #${i}:`);
    
    try {
      const loan = await loanRegistry.getLoanDetails(i);
      const status = loan.status === 0n ? "Active" : loan.status === 1n ? "Completed" : "Defaulted";
      
      console.log(`   Borrower Hash: ${loan.borrowerHash}`);
      console.log(`   Amount: $${ethers.formatUnits(loan.amountInCents, 2)} ${loan.currency}`);
      console.log(`   Status: ${status}`);
      console.log(`   Total Repaid: $${ethers.formatUnits(loan.totalRepaid, 2)} ${loan.currency}`);
      console.log(`   Due Date: ${new Date(Number(loan.dueDate) * 1000).toLocaleDateString()}`);
      console.log("");
    } catch (error) {
      console.log(`   Error retrieving loan details: ${error.message}`);
      console.log("");
    }
  }

  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error viewing loans:");
    console.error(error);
    process.exit(1);
  });

