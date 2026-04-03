/**
 * LoanRegistry Test Suite
 * 
 * TESTING PHILOSOPHY:
 * - Test happy paths (things should work)
 * - Test edge cases (boundary conditions)
 * - Test failure modes (things should fail gracefully)
 * 
 * We use Hardhat's testing framework which includes:
 * - Mocha (test structure with describe/it blocks)
 * - Chai (assertions with expect)
 * - Hardhat helpers (deploy contracts, manage accounts)
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LoanRegistry Contract", function () {
  // Define variables accessible across all tests
  let loanRegistry;
  let admin;
  let user1;
  let user2;

  /**
   * beforeEach runs before EACH test
   * This gives us a fresh contract for every test (isolation)
   */
  beforeEach(async function () {
    // Get test accounts from Hardhat
    // Hardhat provides 20 test accounts with fake ETH
    [admin, user1, user2] = await ethers.getSigners();

    // Deploy the contract
    const LoanRegistry = await ethers.getContractFactory("LoanRegistry");
    loanRegistry = await LoanRegistry.deploy();
    await loanRegistry.waitForDeployment();
  });

  // ============================================
  // DEPLOYMENT TESTS
  // ============================================

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      // The deployer should be set as admin
      expect(await loanRegistry.admin()).to.equal(admin.address);
    });

    it("Should initialize loan count to 0", async function () {
      expect(await loanRegistry.loanCount()).to.equal(0);
    });
  });

  // ============================================
  // LOAN CREATION TESTS
  // ============================================

  describe("Creating Loans", function () {
    it("Should create a loan successfully", async function () {
      // Create a hash for borrower (simulating privacy)
      const borrowerHash = ethers.id("borrower-001");
      
      // Loan details: $100 for 180 days
      const amountInCents = 10000; // $100.00
      const durationDays = 180;
      const currency = "USD";

      // Create the loan
      const tx = await loanRegistry.createLoan(
        borrowerHash,
        amountInCents,
        durationDays,
        currency
      );

      // Wait for transaction to be mined
      await tx.wait();

      // Verify loan count increased
      expect(await loanRegistry.loanCount()).to.equal(1);

      // Verify loan details
      const loan = await loanRegistry.getLoanDetails(0);
      expect(loan.borrowerHash).to.equal(borrowerHash);
      expect(loan.amountInCents).to.equal(amountInCents);
      expect(loan.totalRepaid).to.equal(0);
      expect(loan.status).to.equal(0); // 0 = Active
      expect(loan.currency).to.equal(currency);
    });

    it("Should emit LoanCreated event", async function () {
      const borrowerHash = ethers.id("borrower-002");
      const amountInCents = 5000;
      const durationDays = 90;
      const currency = "USD";

      // expect().to.emit() checks if event was emitted
      await expect(
        loanRegistry.createLoan(
          borrowerHash,
          amountInCents,
          durationDays,
          currency
        )
      )
        .to.emit(loanRegistry, "LoanCreated");
    });

    it("Should fail if non-admin tries to create loan", async function () {
      const borrowerHash = ethers.id("borrower-003");

      // Connect contract as user1 (not admin)
      await expect(
        loanRegistry.connect(user1).createLoan(
          borrowerHash,
          10000,
          180,
          "USD"
        )
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should fail with zero amount", async function () {
      const borrowerHash = ethers.id("borrower-004");

      await expect(
        loanRegistry.createLoan(borrowerHash, 0, 180, "USD")
      ).to.be.revertedWith("Loan amount must be greater than 0");
    });

    it("Should fail with zero duration", async function () {
      const borrowerHash = ethers.id("borrower-005");

      await expect(
        loanRegistry.createLoan(borrowerHash, 10000, 0, "USD")
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should fail with empty currency", async function () {
      const borrowerHash = ethers.id("borrower-006");

      await expect(
        loanRegistry.createLoan(borrowerHash, 10000, 180, "")
      ).to.be.revertedWith("Currency cannot be empty");
    });
  });

  // ============================================
  // REPAYMENT TESTS
  // ============================================

  describe("Recording Repayments", function () {
    let loanId;
    const loanAmount = 10000; // $100

    beforeEach(async function () {
      // Create a loan before each repayment test
      const borrowerHash = ethers.id("borrower-repay");
      const tx = await loanRegistry.createLoan(
        borrowerHash,
        loanAmount,
        180,
        "USD"
      );
      await tx.wait();
      loanId = 0;
    });

    it("Should record a repayment successfully", async function () {
      const repaymentAmount = 2500; // $25

      await loanRegistry.recordRepayment(loanId, repaymentAmount, "First payment");

      // Check loan was updated
      const loan = await loanRegistry.getLoanDetails(loanId);
      expect(loan.totalRepaid).to.equal(repaymentAmount);
      expect(loan.status).to.equal(0); // Still active

      // Check repayment history
      const history = await loanRegistry.getRepaymentHistory(loanId);
      expect(history.length).to.equal(1);
      expect(history[0].amount).to.equal(repaymentAmount);
      expect(history[0].notes).to.equal("First payment");
    });

    it("Should emit RepaymentRecorded event", async function () {
      const repaymentAmount = 2500;

      await expect(
        loanRegistry.recordRepayment(loanId, repaymentAmount, "Test payment")
      )
        .to.emit(loanRegistry, "RepaymentRecorded")
        .withArgs(
          loanId,
          repaymentAmount,
          repaymentAmount, // totalRepaid
          loanAmount - repaymentAmount // remainingBalance
        );
    });

    it("Should mark loan as completed when fully repaid", async function () {
      // Repay full amount
      await loanRegistry.recordRepayment(loanId, loanAmount, "Full payment");

      const loan = await loanRegistry.getLoanDetails(loanId);
      expect(loan.status).to.equal(1); // 1 = Completed
      expect(loan.totalRepaid).to.equal(loanAmount);
    });

    it("Should emit LoanCompleted event on full repayment", async function () {
      await expect(
        loanRegistry.recordRepayment(loanId, loanAmount, "Full payment")
      ).to.emit(loanRegistry, "LoanCompleted");
    });

    it("Should handle multiple repayments correctly", async function () {
      // Multiple partial payments
      await loanRegistry.recordRepayment(loanId, 2500, "Payment 1");
      await loanRegistry.recordRepayment(loanId, 2500, "Payment 2");
      await loanRegistry.recordRepayment(loanId, 5000, "Payment 3");

      const loan = await loanRegistry.getLoanDetails(loanId);
      expect(loan.totalRepaid).to.equal(10000);
      expect(loan.status).to.equal(1); // Completed

      const history = await loanRegistry.getRepaymentHistory(loanId);
      expect(history.length).to.equal(3);
    });

    it("Should handle overpayment correctly", async function () {
      // Repay more than loan amount
      await loanRegistry.recordRepayment(loanId, 15000, "Overpayment");

      const loan = await loanRegistry.getLoanDetails(loanId);
      expect(loan.totalRepaid).to.equal(15000);
      expect(loan.status).to.equal(1); // Completed
    });

    it("Should fail if repayment amount is zero", async function () {
      await expect(
        loanRegistry.recordRepayment(loanId, 0, "Invalid payment")
      ).to.be.revertedWith("Repayment amount must be greater than 0");
    });

    it("Should fail if non-admin tries to record repayment", async function () {
      await expect(
        loanRegistry.connect(user1).recordRepayment(loanId, 1000, "Unauthorized")
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should fail to repay non-existent loan", async function () {
      await expect(
        loanRegistry.recordRepayment(999, 1000, "Non-existent")
      ).to.be.revertedWith("Loan does not exist");
    });
  });

  // ============================================
  // VIEW FUNCTION TESTS
  // ============================================

  describe("View Functions", function () {
    let loanId;
    const loanAmount = 10000;

    beforeEach(async function () {
      const borrowerHash = ethers.id("borrower-view");
      const tx = await loanRegistry.createLoan(
        borrowerHash,
        loanAmount,
        180,
        "USD"
      );
      await tx.wait();
      loanId = 0;
    });

    it("Should get correct remaining balance", async function () {
      // No repayments yet
      expect(await loanRegistry.getRemainingBalance(loanId)).to.equal(loanAmount);

      // After partial repayment
      await loanRegistry.recordRepayment(loanId, 3000, "Partial");
      expect(await loanRegistry.getRemainingBalance(loanId)).to.equal(7000);

      // After full repayment
      await loanRegistry.recordRepayment(loanId, 7000, "Final");
      expect(await loanRegistry.getRemainingBalance(loanId)).to.equal(0);
    });

    it("Should detect overdue loans", async function () {
      // Not overdue initially
      expect(await loanRegistry.isOverdue(loanId)).to.equal(false);

      // Fast forward time 181 days
      await time.increase(181 * 24 * 60 * 60);

      // Now it should be overdue
      expect(await loanRegistry.isOverdue(loanId)).to.equal(true);
    });

    it("Should return correct total loans", async function () {
      expect(await loanRegistry.getTotalLoans()).to.equal(1);

      // Create another loan
      const borrowerHash = ethers.id("borrower-total");
      await loanRegistry.createLoan(borrowerHash, 5000, 90, "USD");

      expect(await loanRegistry.getTotalLoans()).to.equal(2);
    });

    it("Should fail to get details of non-existent loan", async function () {
      await expect(
        loanRegistry.getLoanDetails(999)
      ).to.be.revertedWith("Loan does not exist");
    });
  });

  // ============================================
  // DEFAULT TESTS
  // ============================================

  describe("Loan Defaults", function () {
    let loanId;

    beforeEach(async function () {
      const borrowerHash = ethers.id("borrower-default");
      const tx = await loanRegistry.createLoan(
        borrowerHash,
        10000,
        180,
        "USD"
      );
      await tx.wait();
      loanId = 0;
    });

    it("Should mark loan as defaulted after due date", async function () {
      // Fast forward past due date
      await time.increase(181 * 24 * 60 * 60);

      await loanRegistry.markAsDefaulted(loanId);

      const loan = await loanRegistry.getLoanDetails(loanId);
      expect(loan.status).to.equal(2); // 2 = Defaulted
    });

    it("Should emit LoanDefaulted event", async function () {
      await time.increase(181 * 24 * 60 * 60);

      await expect(loanRegistry.markAsDefaulted(loanId))
        .to.emit(loanRegistry, "LoanDefaulted")
        .withArgs(loanId, await time.latest() + 1);
    });

    it("Should fail to mark as defaulted before due date", async function () {
      await expect(
        loanRegistry.markAsDefaulted(loanId)
      ).to.be.revertedWith("Loan is not yet overdue");
    });

    it("Should fail if non-admin tries to mark default", async function () {
      await time.increase(181 * 24 * 60 * 60);

      await expect(
        loanRegistry.connect(user1).markAsDefaulted(loanId)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should not allow repayments on defaulted loans", async function () {
      // Mark as defaulted
      await time.increase(181 * 24 * 60 * 60);
      await loanRegistry.markAsDefaulted(loanId);

      // Try to record repayment
      await expect(
        loanRegistry.recordRepayment(loanId, 1000, "Too late")
      ).to.be.revertedWith("Loan is not active");
    });
  });

  // ============================================
  // ADMIN TRANSFER TESTS
  // ============================================

  describe("Admin Transfer", function () {
    it("Should transfer admin role successfully", async function () {
      await loanRegistry.transferAdmin(user1.address);
      expect(await loanRegistry.admin()).to.equal(user1.address);
    });

    it("Should allow new admin to create loans", async function () {
      // Transfer admin to user1
      await loanRegistry.transferAdmin(user1.address);

      // user1 should now be able to create loans
      const borrowerHash = ethers.id("borrower-new-admin");
      await expect(
        loanRegistry.connect(user1).createLoan(borrowerHash, 5000, 90, "USD")
      ).to.not.be.reverted;
    });

    it("Should prevent old admin from creating loans after transfer", async function () {
      // Transfer admin to user1
      await loanRegistry.transferAdmin(user1.address);

      // Original admin (admin) should no longer be able to create loans
      const borrowerHash = ethers.id("borrower-old-admin");
      await expect(
        loanRegistry.connect(admin).createLoan(borrowerHash, 5000, 90, "USD")
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should fail if non-admin tries to transfer", async function () {
      await expect(
        loanRegistry.connect(user1).transferAdmin(user2.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should fail transfer to zero address", async function () {
      await expect(
        loanRegistry.transferAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("New admin cannot be zero address");
    });
  });

  // ============================================
  // INTEGRATION TESTS (Full Loan Lifecycle)
  // ============================================

  describe("Full Loan Lifecycle", function () {
    it("Should handle complete loan lifecycle: create → repay → complete", async function () {
      // 1. Create loan
      const borrowerHash = ethers.id("maria-santos");
      await loanRegistry.createLoan(borrowerHash, 10000, 180, "USD");
      
      let loan = await loanRegistry.getLoanDetails(0);
      expect(loan.status).to.equal(0); // Active
      expect(loan.totalRepaid).to.equal(0);

      // 2. Make partial repayments
      await loanRegistry.recordRepayment(0, 2500, "Month 1");
      await loanRegistry.recordRepayment(0, 2500, "Month 2");
      
      loan = await loanRegistry.getLoanDetails(0);
      expect(loan.totalRepaid).to.equal(5000);
      expect(loan.status).to.equal(0); // Still active

      // 3. Final repayment
      await loanRegistry.recordRepayment(0, 5000, "Final payment");
      
      loan = await loanRegistry.getLoanDetails(0);
      expect(loan.status).to.equal(1); // Completed
      expect(loan.totalRepaid).to.equal(10000);

      // 4. Verify repayment history
      const history = await loanRegistry.getRepaymentHistory(0);
      expect(history.length).to.equal(3);
    });

    it("Should track multiple borrowers independently", async function () {
      // Create loans for 3 different borrowers
      const borrowers = [
        { hash: ethers.id("borrower-1"), amount: 10000 },
        { hash: ethers.id("borrower-2"), amount: 15000 },
        { hash: ethers.id("borrower-3"), amount: 20000 },
      ];

      for (const borrower of borrowers) {
        await loanRegistry.createLoan(borrower.hash, borrower.amount, 180, "USD");
      }

      expect(await loanRegistry.getTotalLoans()).to.equal(3);

      // Verify each loan is tracked correctly
      for (let i = 0; i < 3; i++) {
        const loan = await loanRegistry.getLoanDetails(i);
        expect(loan.borrowerHash).to.equal(borrowers[i].hash);
        expect(loan.amountInCents).to.equal(borrowers[i].amount);
      }
    });
  });
});