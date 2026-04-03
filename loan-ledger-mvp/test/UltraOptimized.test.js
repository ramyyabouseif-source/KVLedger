const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ultra-Optimized LoanRegistry Contract", function () {
  let ultraContract;
  let admin;

  beforeEach(async function () {
    [admin] = await ethers.getSigners();
    
    // Deploy ultra-optimized contract
    const LoanRegistryUltraOptimized = await ethers.getContractFactory("LoanRegistryUltraOptimized");
    ultraContract = await LoanRegistryUltraOptimized.deploy();
    await ultraContract.waitForDeployment();
  });

  describe("Ultra-Optimized Gas Usage", function () {
    it("Should create loan with ultra-optimized gas usage", async function () {
      const borrowerHash = ethers.id("ultra-test-borrower");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      
      const tx = await ultraContract.createLoan(borrowerHash, 10000, 180, usdBytes3);
      const receipt = await tx.wait();
      
      console.log("\n" + "=".repeat(60));
      console.log("ULTRA-OPTIMIZED GAS REPORT: createLoan");
      console.log("=".repeat(60));
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Expected: ~95,000 gas (22% better than optimized)");
      console.log("=".repeat(60) + "\n");
      
      expect(receipt.gasUsed).to.be.lessThan(105000); // Should be under 105k gas
    });

    it("Should create multiple loans ultra-efficiently", async function () {
      const borrowerHashes = [
        ethers.id("ultra-batch-1"),
        ethers.id("ultra-batch-2"),
        ethers.id("ultra-batch-3"),
        ethers.id("ultra-batch-4"),
        ethers.id("ultra-batch-5")
      ];
      const amounts = [10000, 15000, 20000, 25000, 30000];
      const durations = [180, 180, 180, 180, 180];
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      const currencies = [usdBytes3, usdBytes3, usdBytes3, usdBytes3, usdBytes3];

      const tx = await ultraContract.createMultipleLoansUltra(
        borrowerHashes,
        amounts,
        durations,
        currencies
      );
      const receipt = await tx.wait();
      
      console.log("\n" + "=".repeat(60));
      console.log("ULTRA-OPTIMIZED BATCH: createMultipleLoansUltra (5 loans)");
      console.log("=".repeat(60));
      console.log("Gas used for 5 loans:", receipt.gasUsed.toString());
      console.log("Average gas per loan:", Math.floor(Number(receipt.gasUsed) / 5).toString());
      console.log("Expected: ~90,000 gas per loan");
      console.log("=".repeat(60) + "\n");
      
      // Verify loans were created
      expect(await ultraContract.getTotalLoans()).to.equal(5);
    });

    it("Should record repayment ultra-efficiently", async function () {
      const borrowerHash = ethers.id("ultra-repayment-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      
      // Create a loan first
      await ultraContract.createLoan(borrowerHash, 10000, 180, usdBytes3);
      
      // Record repayment
      const tx = await ultraContract.recordRepayment(0, 2500, "Ultra payment");
      const receipt = await tx.wait();
      
      console.log("\n" + "=".repeat(60));
      console.log("ULTRA-OPTIMIZED GAS REPORT: recordRepayment");
      console.log("=".repeat(60));
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Expected: ~35,000 gas (13% better than optimized)");
      console.log("=".repeat(60) + "\n");
      
      expect(receipt.gasUsed).to.be.lessThan(40000); // Should be under 40k gas
    });

    it("Should get loan summaries ultra-efficiently", async function () {
      // Create multiple loans
      const borrowerHashes = [
        ethers.id("summary-1"),
        ethers.id("summary-2"),
        ethers.id("summary-3")
      ];
      const amounts = [10000, 15000, 20000];
      const durations = [180, 180, 180];
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      const currencies = [usdBytes3, usdBytes3, usdBytes3];

      await ultraContract.createMultipleLoansUltra(borrowerHashes, amounts, durations, currencies);
      
      // Get summaries (should be very cheap)
      const loanIds = [0, 1, 2];
      const summaries = await ultraContract.getLoanSummariesUltra(loanIds);
      
      console.log("\n" + "=".repeat(60));
      console.log("ULTRA-OPTIMIZED BATCH READ: getLoanSummariesUltra");
      console.log("=".repeat(60));
      console.log("Retrieved", summaries.ids.length, "loan summaries");
      console.log("This operation is free (view function)");
      console.log("=".repeat(60) + "\n");
      
      expect(summaries.ids.length).to.equal(3);
      expect(summaries.amounts[0]).to.equal(10000);
    });
  });

  describe("Functionality Tests", function () {
    it("Should validate loan amount constraints", async function () {
      const borrowerHash = ethers.id("constraint-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      
      // Test valid amount
      expect(await ultraContract.isValidLoanAmount(500000)).to.be.true; // $5,000 max
      expect(await ultraContract.isValidLoanAmount(1)).to.be.true; // $0.01 min
      
      // Test invalid amounts
      expect(await ultraContract.isValidLoanAmount(0)).to.be.false;
      expect(await ultraContract.isValidLoanAmount(500001)).to.be.false; // Over $5,000
      
      // Test creating loan with max amount
      await ultraContract.createLoan(borrowerHash, 500000, 180, usdBytes3);
      expect(await ultraContract.getTotalLoans()).to.equal(1);
    });

    it("Should get contract statistics", async function () {
      // Create some loans
      const borrowerHashes = [
        ethers.id("stats-1"),
        ethers.id("stats-2")
      ];
      const amounts = [10000, 20000];
      const durations = [180, 180];
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      const currencies = [usdBytes3, usdBytes3];

      await ultraContract.createMultipleLoansUltra(borrowerHashes, amounts, durations, currencies);
      
      // Record a repayment
      await ultraContract.recordRepayment(0, 5000, "Partial payment");
      
      // Get stats
      const stats = await ultraContract.getContractStats();
      
      console.log("\n" + "=".repeat(60));
      console.log("CONTRACT STATISTICS");
      console.log("=".repeat(60));
      console.log("Total loans:", stats.totalLoans.toString());
      console.log("Active loans:", stats.activeLoans.toString());
      console.log("Completed loans:", stats.completedLoans.toString());
      console.log("Total amount lent:", stats.totalAmountLent.toString(), "cents");
      console.log("Total amount repaid:", stats.totalAmountRepaid.toString(), "cents");
      console.log("=".repeat(60) + "\n");
      
      expect(stats.totalLoans).to.equal(2);
      expect(stats.activeLoans).to.equal(2);
      expect(stats.totalAmountLent).to.equal(30000);
      expect(stats.totalAmountRepaid).to.equal(5000);
    });

    it("Should filter loans by status", async function () {
      // Create loans
      const borrowerHashes = [
        ethers.id("filter-1"),
        ethers.id("filter-2"),
        ethers.id("filter-3")
      ];
      const amounts = [10000, 15000, 20000];
      const durations = [180, 180, 180];
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      const currencies = [usdBytes3, usdBytes3, usdBytes3];

      await ultraContract.createMultipleLoansUltra(borrowerHashes, amounts, durations, currencies);
      
      // Complete one loan
      await ultraContract.recordRepayment(0, 10000, "Full payment");
      
      // Get active loans
      const activeLoans = await ultraContract.getLoansByStatus(0); // STATUS_ACTIVE = 0
      expect(activeLoans.length).to.equal(2);
      
      // Get completed loans
      const completedLoans = await ultraContract.getLoansByStatus(1); // STATUS_COMPLETED = 1
      expect(completedLoans.length).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum loan amount", async function () {
      const borrowerHash = ethers.id("max-amount-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      
      // Create loan with maximum amount ($5,000)
      await ultraContract.createLoan(borrowerHash, 500000, 180, usdBytes3);
      
      const loan = await ultraContract.getLoanDetails(0);
      expect(loan.amountInCents).to.equal(500000);
      
      // Record maximum repayment
      await ultraContract.recordRepayment(0, 500000, "Full payment");
      
      const remaining = await ultraContract.getRemainingBalance(0);
      expect(remaining).to.equal(0);
    });

    it("Should handle maximum duration", async function () {
      const borrowerHash = ethers.id("max-duration-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      
      // Create loan with maximum duration (65,535 days)
      await ultraContract.createLoan(borrowerHash, 10000, 65535, usdBytes3);
      
      const loan = await ultraContract.getLoanDetails(0);
      expect(loan.durationDays).to.equal(65535);
    });
  });
});