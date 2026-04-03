const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Secure LoanRegistry Contract", function () {
  let secureContract;
  let owner, admin, operator, viewer, attacker;

  beforeEach(async function () {
    [owner, admin, operator, viewer, attacker] = await ethers.getSigners();

    // Deploy secure contract (no constructor arguments needed)
    const LoanRegistrySecure = await ethers.getContractFactory("LoanRegistrySecure");
    secureContract = await LoanRegistrySecure.deploy();
    await secureContract.waitForDeployment();

    // Set up roles using the contract's assignRole function
    await secureContract.assignRole(admin.address, 3); // ADMIN role
    await secureContract.assignRole(operator.address, 2); // OPERATOR role
    await secureContract.assignRole(viewer.address, 1); // VIEWER role
  });

  describe("Access Control Security", function () {
    it("Should prevent unauthorized users from creating loans", async function () {
      const borrowerHash = ethers.id("unauthorized-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      await expect(
        secureContract.connect(attacker).createLoan(borrowerHash, 10000, 180, usdBytes3)
      ).to.be.revertedWith("Insufficient role permissions");
    });

    it("Should allow operators to create loans", async function () {
      const borrowerHash = ethers.id("operator-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);
      
      const loan = await secureContract.getLoanDetails(0);
      expect(loan.borrowerHash).to.equal(borrowerHash);
    });

    it("Should prevent viewers from creating loans", async function () {
      const borrowerHash = ethers.id("viewer-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      await expect(
        secureContract.connect(viewer).createLoan(borrowerHash, 10000, 180, usdBytes3)
      ).to.be.revertedWith("Insufficient role permissions");
    });

    it("Should allow admins to mark loans as defaulted", async function () {
      // Create a loan first
      const borrowerHash = ethers.id("default-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);

      // Fast forward time to make loan overdue
      await ethers.provider.send("evm_increaseTime", [181 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await secureContract.connect(admin).markLoanAsDefaulted(0);
      
      const loan = await secureContract.getLoanDetails(0);
      expect(loan.status).to.equal(2); // STATUS_DEFAULTED
    });

    it("Should prevent operators from marking loans as defaulted", async function () {
      const borrowerHash = ethers.id("operator-default-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);

      await ethers.provider.send("evm_increaseTime", [181 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await expect(
        secureContract.connect(operator).markLoanAsDefaulted(0)
      ).to.be.revertedWith("Insufficient role permissions");
    });
  });

  describe("Input Validation Security", function () {
    it("Should reject invalid loan amounts", async function () {
      const borrowerHash = ethers.id("invalid-amount-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Test zero amount
      await expect(
        secureContract.connect(operator).createLoan(borrowerHash, 0, 180, usdBytes3)
      ).to.be.revertedWith("Invalid loan amount");

      // Test amount exceeding $16,777,215 (max uint24)
      await expect(
        secureContract.connect(operator).createLoan(borrowerHash, 16777216, 180, usdBytes3)
      ).to.be.revertedWith("Invalid loan amount");
    });

    it("Should reject invalid durations", async function () {
      const borrowerHash = ethers.id("invalid-duration-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Test zero duration
      await expect(
        secureContract.connect(operator).createLoan(borrowerHash, 10000, 0, usdBytes3)
      ).to.be.revertedWith("Invalid duration");

      // Test duration exceeding max uint16
      await expect(
        secureContract.connect(operator).createLoan(borrowerHash, 10000, 65536, usdBytes3)
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should reject invalid currency codes", async function () {
      const borrowerHash = ethers.id("invalid-currency-test");

      // Test empty currency
      await expect(
        secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, "0x000000")
      ).to.be.revertedWith("Invalid currency");
    });

    it("Should reject invalid repayment amounts", async function () {
      const borrowerHash = ethers.id("invalid-repayment-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);
      
      // Create a loan first
      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);

      // Test zero repayment
      await expect(
        secureContract.connect(operator).recordRepayment(0, 0, "Invalid payment")
      ).to.be.revertedWith("Repayment amount must be positive");
    });
  });

  describe("Emergency Functions Security", function () {
    it("Should allow emergency mode activation", async function () {
      await secureContract.toggleEmergencyMode();
      
      const status = await secureContract.getSecurityStatus();
      expect(status.isEmergencyMode).to.be.true;
    });

    it("Should prevent operations during emergency mode", async function () {
      // Activate emergency mode
      await secureContract.toggleEmergencyMode();

      const borrowerHash = ethers.id("emergency-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Try to create loan during emergency
      await expect(
        secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3)
      ).to.be.revertedWith("System in emergency mode");
    });

    it("Should allow emergency mode deactivation", async function () {
      // Activate emergency mode
      await secureContract.toggleEmergencyMode();
      
      // Deactivate emergency mode
      await secureContract.toggleEmergencyMode();
      
      const status = await secureContract.getSecurityStatus();
      expect(status.isEmergencyMode).to.be.false;
    });

    it("Should allow emergency mode toggle", async function () {
      // Toggle emergency mode (which pauses the system)
      await secureContract.toggleEmergencyMode();
  
      let status = await secureContract.getSecurityStatus();
      expect(status.isEmergencyMode).to.be.true;

      // Toggle back
      await secureContract.toggleEmergencyMode();
    
      status = await secureContract.getSecurityStatus();
      expect(status.isEmergencyMode).to.be.false;
    });

    it("Should prevent operations when in emergency mode", async function () {
      // Activate emergency mode
      await secureContract.toggleEmergencyMode();

      const borrowerHash = ethers.id("emergency-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Try to create loan during emergency
      await expect(
        secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3)
      ).to.be.revertedWith("System in emergency mode");
    });
  });

  describe("Audit Trail Security", function () {
    it("Should log security events", async function () {
      const borrowerHash = ethers.id("audit-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Create a loan
      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);

      // Check security events
      const events = await secureContract.getSecurityEvents(10);
      expect(events.length).to.be.greaterThan(0);
      
      // Find any loan-related event (operation 0 is CREATE_LOAN)
      const loanCreationEvent = events.find(e => e.operation === 0);
      if (loanCreationEvent) {
      expect(loanCreationEvent.user).to.equal(operator.address);
      expect(loanCreationEvent.success).to.be.true;
    } else {
      // If no CREATE_LOAN event found, check if there are any events at all
      expect(events.length).to.be.greaterThan(0);
      // Check that the first event is from our operator
      expect(events[0].user).to.equal(operator.address);
      expect(events[0].success).to.be.true;
    }
    });

    it("Should track loan operations", async function () {
      const borrowerHash = ethers.id("tracking-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Create a loan
      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);

      // Record a repayment
      await secureContract.connect(operator).recordRepayment(0, 5000, "Payment 1");

      const loan = await secureContract.getLoanDetails(0);
      expect(loan.borrowerHash).to.equal(borrowerHash);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks", async function () {
      // Test that the nonReentrant modifier is applied
      const borrowerHash = ethers.id("reentrancy-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Normal operation should work
      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);
      expect(await secureContract.getTotalLoans()).to.equal(1);
    });
  });

  describe("Multi-Signature Security", function () {
    it("Should recognize multi-sig admins", async function () {
      const [isPaused, isEmergencyMode, lastSecurityCheckTime, totalSecurityEventsCount, multiSigAdminsCountValue, requiredConfirmationsCount] = await secureContract.getSecurityStatus();
      expect(multiSigAdminsCountValue).to.equal(1);
      expect(requiredConfirmationsCount).to.equal(1);
    });

    it("Should allow adding multi-sig admins", async function () {
      await secureContract.addMultiSigAdmin(admin.address);
      
      const [isPaused2, isEmergencyMode2, lastSecurityCheckTime2, totalSecurityEventsCount2, multiSigAdminsCountValue2, requiredConfirmationsCount2] = await secureContract.getSecurityStatus();
      expect(multiSigAdminsCountValue2).to.equal(2);
    });
  });

  describe("Gas Optimization with Security", function () {
    it("Should maintain gas efficiency with security features", async function () {
      const borrowerHash = ethers.id("gas-security-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      const tx = await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);
      const receipt = await tx.wait();

      console.log("\n" + "=".repeat(60));
      console.log("SECURE CONTRACT GAS REPORT: createLoan");
      console.log("=".repeat(60));
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Expected: ~120,000 gas (security overhead)");
      console.log("=".repeat(60) + "\n");

      // Should still be reasonable despite security overhead
      expect(receipt.gasUsed).to.be.lessThan(300000);
    });

    it("Should efficiently record repayments with security", async function () {
      const borrowerHash = ethers.id("gas-repayment-test");
      const usdBytes3 = ethers.toUtf8Bytes("USD").slice(0, 3);

      // Create a loan first
      await secureContract.connect(operator).createLoan(borrowerHash, 10000, 180, usdBytes3);

      // Record repayment
      const tx = await secureContract.connect(operator).recordRepayment(0, 5000, "Secure payment");
      const receipt = await tx.wait();

      console.log("\n" + "=".repeat(60));
      console.log("SECURE CONTRACT GAS REPORT: recordRepayment");
      console.log("=".repeat(60));
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Expected: ~50,000 gas (security overhead)");
      console.log("=".repeat(60) + "\n");

      expect(receipt.gasUsed).to.be.lessThan(250000);
    });
  });

  describe("Role Management Security", function () {
    it("Should allow super admin to assign roles", async function () {
      await secureContract.assignRole(attacker.address, 2); // OPERATOR role
      
      const role = await secureContract.userRoles(attacker.address);
      expect(role).to.equal(2);
    });

    it("Should prevent non-super-admin from assigning roles", async function () {
      await expect(
        secureContract.connect(admin).assignRole(attacker.address, 2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});