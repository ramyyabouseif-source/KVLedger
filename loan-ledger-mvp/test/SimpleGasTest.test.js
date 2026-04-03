const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Gas Test", function () {
  it("Should show gas usage for createLoan", async function () {
    const [admin] = await ethers.getSigners();
    const LoanRegistry = await ethers.getContractFactory("LoanRegistry");
    const loanRegistry = await LoanRegistry.deploy();
    await loanRegistry.waitForDeployment();

    const borrowerHash = ethers.id("test-borrower");
    
    // Create loan and measure gas
    const tx = await loanRegistry.createLoan(borrowerHash, 10000, 180, "USD");
    const receipt = await tx.wait();
    
    console.log("\n" + "=".repeat(50));
    console.log("GAS USAGE REPORT");
    console.log("=".repeat(50));
    console.log("createLoan gas used:", receipt.gasUsed.toString());
    console.log("Gas price:", receipt.gasPrice?.toString() || "N/A");
    console.log("Transaction cost:", ethers.formatEther(receipt.gasUsed * (receipt.gasPrice || 0)), "ETH");
    console.log("=".repeat(50) + "\n");
    
    expect(receipt.gasUsed).to.be.greaterThan(0);
  });

  it("Should show gas usage for recordRepayment", async function () {
    const [admin] = await ethers.getSigners();
    const LoanRegistry = await ethers.getContractFactory("LoanRegistry");
    const loanRegistry = await LoanRegistry.deploy();
    await loanRegistry.waitForDeployment();

    // Create a loan first
    const borrowerHash = ethers.id("test-borrower");
    await loanRegistry.createLoan(borrowerHash, 10000, 180, "USD");
    
    // Record repayment and measure gas
    const tx = await loanRegistry.recordRepayment(0, 2500, "Test payment");
    const receipt = await tx.wait();
    
    console.log("\n" + "=".repeat(50));
    console.log("GAS USAGE REPORT");
    console.log("=".repeat(50));
    console.log("recordRepayment gas used:", receipt.gasUsed.toString());
    console.log("Gas price:", receipt.gasPrice?.toString() || "N/A");
    console.log("Transaction cost:", ethers.formatEther(receipt.gasUsed * (receipt.gasPrice || 0)), "ETH");
    console.log("=".repeat(50) + "\n");
    
    expect(receipt.gasUsed).to.be.greaterThan(0);
  });
});