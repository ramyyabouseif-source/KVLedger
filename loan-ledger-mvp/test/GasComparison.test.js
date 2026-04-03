const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Comparison: Original vs Optimized", function () {
  let originalContract, optimizedContract;
  let admin;

  beforeEach(async function () {
    [admin] = await ethers.getSigners();
    
    // Deploy original contract
    const LoanRegistry = await ethers.getContractFactory("LoanRegistry");
    originalContract = await LoanRegistry.deploy();
    await originalContract.waitForDeployment();
    
    // Deploy optimized contract
    const LoanRegistryOptimized = await ethers.getContractFactory("LoanRegistryOptimized");
    optimizedContract = await LoanRegistryOptimized.deploy();
    await optimizedContract.waitForDeployment();
  });

  it("Should compare gas usage for createLoan", async function () {
    const borrowerHash = ethers.id("comparison-test");
    
    // Test original contract (uses string)
    const originalTx = await originalContract.createLoan(borrowerHash, 10000, 180, "USD");
    const originalReceipt = await originalTx.wait();
    
    // Test optimized contract (uses bytes3 - convert "USD" to bytes3 correctly)
    const usdBytes = ethers.toUtf8Bytes("USD"); // This gives us [0x55, 0x53, 0x44]
    const usdBytes3 = usdBytes.slice(0, 3); // Take only first 3 bytes
    const optimizedTx = await optimizedContract.createLoan(borrowerHash, 10000, 180, usdBytes3);
    const optimizedReceipt = await optimizedTx.wait();
    
    console.log("\n" + "=".repeat(60));
    console.log("GAS COMPARISON: createLoan");
    console.log("=".repeat(60));
    console.log("Original contract gas:", originalReceipt.gasUsed.toString());
    console.log("Optimized contract gas:", optimizedReceipt.gasUsed.toString());
    
    const savings = originalReceipt.gasUsed - optimizedReceipt.gasUsed;
    const savingsPercent = (Number(savings) * 100) / Number(originalReceipt.gasUsed);
    
    console.log("Gas saved:", savings.toString());
    console.log("Savings percentage:", savingsPercent.toFixed(2) + "%");
    console.log("=".repeat(60) + "\n");
    
    expect(optimizedReceipt.gasUsed).to.be.lessThan(originalReceipt.gasUsed);
  });

  it("Should compare gas usage for recordRepayment", async function () {
    const borrowerHash = ethers.id("repayment-comparison");
    
    // Create loans in both contracts
    await originalContract.createLoan(borrowerHash, 10000, 180, "USD");
    
    const usdBytes = ethers.toUtf8Bytes("USD");
    const usdBytes3 = usdBytes.slice(0, 3);
    await optimizedContract.createLoan(borrowerHash, 10000, 180, usdBytes3);
    
    // Test original contract
    const originalTx = await originalContract.recordRepayment(0, 2500, "Test payment");
    const originalReceipt = await originalTx.wait();
    
    // Test optimized contract
    const optimizedTx = await optimizedContract.recordRepayment(0, 2500, "Test payment");
    const optimizedReceipt = await optimizedTx.wait();
    
    console.log("\n" + "=".repeat(60));
    console.log("GAS COMPARISON: recordRepayment");
    console.log("=".repeat(60));
    console.log("Original contract gas:", originalReceipt.gasUsed.toString());
    console.log("Optimized contract gas:", optimizedReceipt.gasUsed.toString());
    
    const savings = originalReceipt.gasUsed - optimizedReceipt.gasUsed;
    const savingsPercent = (Number(savings) * 100) / Number(originalReceipt.gasUsed);
    
    console.log("Gas saved:", savings.toString());
    console.log("Savings percentage:", savingsPercent.toFixed(2) + "%");
    console.log("=".repeat(60) + "\n");
    
    expect(optimizedReceipt.gasUsed).to.be.lessThan(originalReceipt.gasUsed);
  });

  it("Should test batch operations", async function () {
    // Test creating multiple loans at once
    const borrowerHashes = [
      ethers.id("batch-1"),
      ethers.id("batch-2"),
      ethers.id("batch-3")
    ];
    const amounts = [10000, 15000, 20000];
    const durations = [180, 180, 180];
    
    // Convert strings to bytes3 arrays correctly
    const usdBytes = ethers.toUtf8Bytes("USD");
    const usdBytes3 = usdBytes.slice(0, 3);
    const currencies = [usdBytes3, usdBytes3, usdBytes3];

    const tx = await optimizedContract.createMultipleLoans(
      borrowerHashes,
      amounts,
      durations,
      currencies
    );
    const receipt = await tx.wait();
    
    console.log("\n" + "=".repeat(60));
    console.log("BATCH OPERATION: createMultipleLoans (3 loans)");
    console.log("=".repeat(60));
    console.log("Gas used for 3 loans:", receipt.gasUsed.toString());
    console.log("Average gas per loan:", Math.floor(Number(receipt.gasUsed) / 3).toString());
    console.log("=".repeat(60) + "\n");
    
    // Verify loans were created
    expect(await optimizedContract.getTotalLoans()).to.equal(3);
  });

  it("Should test loan summary function", async function () {
    const borrowerHash = ethers.id("summary-test");
    const usdBytes = ethers.toUtf8Bytes("USD");
    const usdBytes3 = usdBytes.slice(0, 3);
    
    // Create a loan
    await optimizedContract.createLoan(borrowerHash, 10000, 180, usdBytes3);
    
    // Get summary
    const summary = await optimizedContract.getLoanSummary(0);
    
    console.log("\n" + "=".repeat(60));
    console.log("LOAN SUMMARY TEST");
    console.log("=".repeat(60));
    console.log("Loan ID:", summary.id.toString());
    console.log("Amount:", summary.amount.toString());
    console.log("Repaid:", summary.repaid.toString());
    console.log("Remaining:", summary.remaining.toString());
    console.log("Status:", summary.status.toString());
    console.log("Currency bytes:", ethers.hexlify(summary.currency));
    console.log("Currency string:", ethers.toUtf8String(summary.currency));
    console.log("=".repeat(60) + "\n");
    
    expect(summary.amount).to.equal(10000);
    expect(summary.remaining).to.equal(10000);
  });
});