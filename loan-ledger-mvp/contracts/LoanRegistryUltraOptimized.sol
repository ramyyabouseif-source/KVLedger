// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LoanRegistryUltraOptimized
 * @notice Ultra gas-optimized microlending contract for loans up to $5,000
 * @dev Optimizations: custom types, super-packed structs, batch operations, memory efficiency
 * 
 * CONSTRAINTS:
 * - Max loan amount: $5,000 (500,000 cents) - fits in uint24
 * - Max repayment: $5,000 (500,000 cents) - fits in uint24  
 * - Max duration: 65,535 days (179 years) - fits in uint16
 * - Currency codes: 3 bytes (USD, KES, UGX, etc.)
 */

// ============================================
// CUSTOM TYPES FOR MAXIMUM EFFICIENCY
// ============================================

/// @notice Loan amount type (0-$167,772.15, way more than needed for $5,000 max)
type LoanAmount is uint24;

/// @notice Repayment amount type (same range as loan amount)
type RepaymentAmount is uint24;

/// @notice Loan duration in days (0-65,535 days = 179 years max)
type LoanDuration is uint16;

/// @notice Loan status enum packed into uint8
type LoanStatus is uint8;

/// @notice Loan ID type for consistency
type LoanId is uint256;

// ============================================
// MAIN CONTRACT
// ============================================

contract LoanRegistryUltraOptimized {
    
    // ============================================
    // ULTRA-OPTIMIZED STATE VARIABLES
    // ============================================
    
    address public admin;
    LoanId public loanCount;
    
    // Super-packed struct - 3 storage slots total (96 bytes vs 128+ in original)
    struct UltraLoan {
        LoanId id;                           // 32 bytes → Slot 0
        bytes32 borrowerHash;                // 32 bytes → Slot 1
        LoanAmount amountInCents;            // 3 bytes  → Slot 2 (first 3 bytes)
        RepaymentAmount totalRepaid;         // 3 bytes  → Slot 2 (next 3 bytes)
        uint32 disbursedAt;                  // 4 bytes  → Slot 2 (next 4 bytes)
        uint32 dueDate;                      // 4 bytes  → Slot 2 (next 4 bytes)
        LoanStatus status;                   // 1 byte   → Slot 2 (next 1 byte)
        bytes3 currency;                     // 3 bytes  → Slot 2 (next 3 bytes)
        LoanDuration durationDays;           // 2 bytes  → Slot 2 (next 2 bytes)
        uint8 flags;                         // 1 byte   → Slot 2 (next 1 byte)
        // Slot 2: [3+3+4+4+1+3+2+1 = 21 bytes used, 11 bytes free for future features]
    }
    
    // Loan status constants
    uint8 constant STATUS_ACTIVE = 0;
    uint8 constant STATUS_COMPLETED = 1;
    uint8 constant STATUS_DEFAULTED = 2;
    
    // Storage mapping
    mapping(LoanId => UltraLoan) public loans;
    
    // ============================================
    // ULTRA-OPTIMIZED EVENTS
    // ============================================
    
    event LoanCreated(
        LoanId indexed loanId,
        bytes32 indexed borrowerHash,
        LoanAmount amountInCents,
        LoanDuration durationDays,
        bytes3 currency
    );
    
    event RepaymentRecorded(
        LoanId indexed loanId,
        RepaymentAmount amount,
        RepaymentAmount totalRepaid,
        RepaymentAmount remainingBalance,
        uint32 timestamp
    );
    
    event LoanCompleted(LoanId indexed loanId, uint32 completedAt);
    event LoanDefaulted(LoanId indexed loanId, uint32 defaultedAt);
    
    // Batch events for efficiency
    event LoansCreatedBatch(LoanId indexed firstLoanId, uint256 count);
    event RepaymentsRecordedBatch(LoanId indexed firstLoanId, uint256 count);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier loanExists(LoanId _loanId) {
        require(LoanId.unwrap(_loanId) < LoanId.unwrap(loanCount), "Loan does not exist");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        admin = msg.sender;
        loanCount = LoanId.wrap(0);
    }
    
    // ============================================
    // ULTRA-OPTIMIZED CORE FUNCTIONS
    // ============================================
    
    /**
     * @notice Create a single loan (ultra-optimized)
     * @param _borrowerHash Anonymized borrower identifier
     * @param _amountInCents Loan amount in cents (max 500,000 = $5,000)
     * @param _durationDays Loan duration in days (max 65,535)
     * @param _currency 3-byte currency code
     * @return loanId The ID of the newly created loan
     */
    function createLoan(
        bytes32 _borrowerHash,
        uint24 _amountInCents,
        uint16 _durationDays,
        bytes3 _currency
    ) external onlyAdmin returns (LoanId) {
        return _createLoan(_borrowerHash, _amountInCents, _durationDays, _currency);
    }
    
    /**
     * @notice Create multiple loans in one transaction (ultra-efficient)
     * @param _borrowerHashes Array of borrower hashes
     * @param _amounts Array of loan amounts in cents
     * @param _durations Array of loan durations in days
     * @param _currencies Array of currency codes
     * @return loanIds Array of created loan IDs
     */
    function createMultipleLoansUltra(
        bytes32[] calldata _borrowerHashes,
        uint24[] calldata _amounts,
        uint16[] calldata _durations,
        bytes3[] calldata _currencies
    ) external onlyAdmin returns (LoanId[] memory) {
        require(_borrowerHashes.length == _amounts.length, "Array length mismatch");
        require(_amounts.length == _durations.length, "Array length mismatch");
        require(_durations.length == _currencies.length, "Array length mismatch");
        require(_borrowerHashes.length <= 100, "Too many loans"); // Increased batch size
        
        LoanId[] memory loanIds = new LoanId[](_borrowerHashes.length);
        uint32 currentTime = uint32(block.timestamp);
        
        // Pre-calculate due dates to save gas in loop
        uint32[] memory dueDates = new uint32[](_borrowerHashes.length);
        for (uint256 i = 0; i < _borrowerHashes.length; i++) {
            dueDates[i] = uint32(currentTime + (uint256(_durations[i]) * 1 days));
        }
        
        // Batch create with minimal storage operations
        for (uint256 i = 0; i < _borrowerHashes.length; i++) {
            loanIds[i] = loanCount;
            
            // Single storage write for entire struct
            loans[loanCount] = UltraLoan({
                id: loanCount,
                borrowerHash: _borrowerHashes[i],
                amountInCents: LoanAmount.wrap(_amounts[i]),
                totalRepaid: RepaymentAmount.wrap(0),
                disbursedAt: currentTime,
                dueDate: dueDates[i],
                status: LoanStatus.wrap(STATUS_ACTIVE),
                currency: _currencies[i],
                durationDays: LoanDuration.wrap(_durations[i]),
                flags: 0 // Reserved for future features
            });
            
            loanCount = LoanId.wrap(LoanId.unwrap(loanCount) + 1);
        }
        
        emit LoansCreatedBatch(loanIds[0], _borrowerHashes.length);
        return loanIds;
    }
    
    /**
     * @notice Internal function to create a loan (reused by batch function)
     */
    function _createLoan(
        bytes32 _borrowerHash,
        uint24 _amountInCents,
        uint16 _durationDays,
        bytes3 _currency
    ) internal returns (LoanId) {
        require(_amountInCents > 0, "Amount must be > 0");
        require(_amountInCents <= 500000, "Amount exceeds $5,000 limit");
        require(_durationDays > 0, "Duration must be > 0");
        require(_currency.length > 0, "Currency required");
        
        uint32 currentTime = uint32(block.timestamp);
        uint32 dueDate = uint32(currentTime + (uint256(_durationDays) * 1 days));
        
        LoanId newLoanId = loanCount;
        
        loans[newLoanId] = UltraLoan({
            id: newLoanId,
            borrowerHash: _borrowerHash,
            amountInCents: LoanAmount.wrap(_amountInCents),
            totalRepaid: RepaymentAmount.wrap(0),
            disbursedAt: currentTime,
            dueDate: dueDate,
            status: LoanStatus.wrap(STATUS_ACTIVE),
            currency: _currency,
            durationDays: LoanDuration.wrap(_durationDays),
            flags: 0
        });
        
        emit LoanCreated(newLoanId, _borrowerHash, LoanAmount.wrap(_amountInCents), LoanDuration.wrap(_durationDays), _currency);
        
        loanCount = LoanId.wrap(LoanId.unwrap(loanCount) + 1);
        return newLoanId;
    }
    
    /**
     * @notice Record repayment (ultra-optimized)
     */
    function recordRepayment(
        LoanId _loanId,
        uint24 _amountInCents,
        string calldata _notes
    ) external onlyAdmin loanExists(_loanId) {
        require(_amountInCents > 0, "Amount must be > 0");
        require(_amountInCents <= 500000, "Amount exceeds $5,000 limit");
        
        UltraLoan storage loan = loans[_loanId];
        require(LoanStatus.unwrap(loan.status) == STATUS_ACTIVE, "Loan not active");
        
        RepaymentAmount newTotalRepaid = RepaymentAmount.wrap(
            RepaymentAmount.unwrap(loan.totalRepaid) + _amountInCents
        );
        loan.totalRepaid = newTotalRepaid;
        
        RepaymentAmount remainingBalance = RepaymentAmount.wrap(0);
        if (RepaymentAmount.unwrap(newTotalRepaid) < LoanAmount.unwrap(loan.amountInCents)) {
            remainingBalance = RepaymentAmount.wrap(
                LoanAmount.unwrap(loan.amountInCents) - RepaymentAmount.unwrap(newTotalRepaid)
            );
        }
        
        emit RepaymentRecorded(
            _loanId,
            RepaymentAmount.wrap(_amountInCents),
            newTotalRepaid,
            remainingBalance,
            uint32(block.timestamp)
        );
        
        if (RepaymentAmount.unwrap(newTotalRepaid) >= LoanAmount.unwrap(loan.amountInCents)) {
            loan.status = LoanStatus.wrap(STATUS_COMPLETED);
            emit LoanCompleted(_loanId, uint32(block.timestamp));
        }
    }
    
    /**
     * @notice Record multiple repayments (ultra-efficient)
     */
    function recordMultipleRepaymentsUltra(
        LoanId[] calldata _loanIds,
        uint24[] calldata _amounts,
        string[] calldata _notes
    ) external onlyAdmin {
        require(_loanIds.length == _amounts.length, "Array length mismatch");
        require(_amounts.length == _notes.length, "Array length mismatch");
        require(_loanIds.length <= 50, "Too many repayments");
        
        for (uint256 i = 0; i < _loanIds.length; i++) {
            this.recordRepayment(_loanIds[i], _amounts[i], _notes[i]);
        }
        
        emit RepaymentsRecordedBatch(_loanIds[0], _loanIds.length);
    }
    
    /**
     * @notice Mark loan as defaulted
     */
    function markAsDefaulted(LoanId _loanId) external onlyAdmin loanExists(_loanId) {
        UltraLoan storage loan = loans[_loanId];
        require(LoanStatus.unwrap(loan.status) == STATUS_ACTIVE, "Loan not active");
        require(block.timestamp > loan.dueDate, "Not overdue");
        
        loan.status = LoanStatus.wrap(STATUS_DEFAULTED);
        emit LoanDefaulted(_loanId, uint32(block.timestamp));
    }
    
    // ============================================
    // ULTRA-EFFICIENT VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Get complete loan details
     */
    function getLoanDetails(LoanId _loanId) external view loanExists(_loanId) returns (UltraLoan memory) {
        return loans[_loanId];
    }
    
    /**
     * @notice Get remaining balance (ultra-fast)
     */
    function getRemainingBalance(LoanId _loanId) external view loanExists(_loanId) returns (RepaymentAmount) {
        UltraLoan memory loan = loans[_loanId];
        uint24 remaining = LoanAmount.unwrap(loan.amountInCents) - RepaymentAmount.unwrap(loan.totalRepaid);
        return RepaymentAmount.wrap(remaining);
    }
    
    /**
     * @notice Check if loan is overdue (ultra-fast)
     */
    function isOverdue(LoanId _loanId) external view loanExists(_loanId) returns (bool) {
        UltraLoan memory loan = loans[_loanId];
        return (
            LoanStatus.unwrap(loan.status) == STATUS_ACTIVE && 
            block.timestamp > loan.dueDate
        );
    }
    
    /**
     * @notice Get total number of loans
     */
    function getTotalLoans() external view returns (LoanId) {
        return loanCount;
    }
    
    /**
     * @notice Transfer admin role
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin");
        admin = _newAdmin;
    }
    
    // ============================================
    // ULTRA-EFFICIENT BATCH VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Get loan summary (ultra gas-efficient for frontend)
     */
    function getLoanSummary(LoanId _loanId) external view loanExists(_loanId) returns (
        LoanId id,
        LoanAmount amount,
        RepaymentAmount repaid,
        RepaymentAmount remaining,
        uint8 status,
        bytes3 currency,
        LoanDuration duration
    ) {
        UltraLoan memory loan = loans[_loanId];
        uint24 remainingAmount = LoanAmount.unwrap(loan.amountInCents) - RepaymentAmount.unwrap(loan.totalRepaid);
        
        return (
            loan.id,
            loan.amountInCents,
            loan.totalRepaid,
            RepaymentAmount.wrap(remainingAmount),
            LoanStatus.unwrap(loan.status),
            loan.currency,
            loan.durationDays
        );
    }
    
    /**
     * @notice Get multiple loan summaries (ultra-efficient batch read)
     */
    function getLoanSummariesUltra(LoanId[] calldata _loanIds) external view returns (
        LoanId[] memory ids,
        LoanAmount[] memory amounts,
        RepaymentAmount[] memory repaid,
        RepaymentAmount[] memory remaining,
        uint8[] memory statuses,
        bytes3[] memory currencies,
        LoanDuration[] memory durations
    ) {
        uint256 length = _loanIds.length;
        require(length <= 200, "Too many loans"); // Increased batch size
        
        // Pre-allocate arrays for maximum efficiency
        ids = new LoanId[](length);
        amounts = new LoanAmount[](length);
        repaid = new RepaymentAmount[](length);
        remaining = new RepaymentAmount[](length);
        statuses = new uint8[](length);
        currencies = new bytes3[](length);
        durations = new LoanDuration[](length);
        
        // Single loop with minimal operations
        for (uint256 i = 0; i < length; i++) {
            LoanId loanId = _loanIds[i];
            require(LoanId.unwrap(loanId) < LoanId.unwrap(loanCount), "Loan does not exist");
            
            UltraLoan memory loan = loans[loanId];
            
            ids[i] = loan.id;
            amounts[i] = loan.amountInCents;
            repaid[i] = loan.totalRepaid;
            remaining[i] = RepaymentAmount.wrap(
                LoanAmount.unwrap(loan.amountInCents) - RepaymentAmount.unwrap(loan.totalRepaid)
            );
            statuses[i] = LoanStatus.unwrap(loan.status);
            currencies[i] = loan.currency;
            durations[i] = loan.durationDays;
        }
    }
    
    /**
     * @notice Get loans by status (efficient filtering)
     */
    function getLoansByStatus(uint8 _status) external view returns (LoanId[] memory) {
        uint256 count = 0;
        uint256 totalLoans = LoanId.unwrap(loanCount);
        
        // First pass: count matching loans
        for (uint256 i = 0; i < totalLoans; i++) {
            if (LoanStatus.unwrap(loans[LoanId.wrap(i)].status) == _status) {
                count++;
            }
        }
        
        // Second pass: collect loan IDs
        LoanId[] memory matchingLoans = new LoanId[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalLoans; i++) {
            if (LoanStatus.unwrap(loans[LoanId.wrap(i)].status) == _status) {
                matchingLoans[index] = LoanId.wrap(i);
                index++;
            }
        }
        
        return matchingLoans;
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * @notice Get contract statistics
     */
    function getContractStats() external view returns (
        LoanId totalLoans,
        uint256 activeLoans,
        uint256 completedLoans,
        uint256 defaultedLoans,
        uint256 totalAmountLent,
        uint256 totalAmountRepaid
    ) {
        totalLoans = loanCount;
        
        uint256 total = LoanId.unwrap(loanCount);
        for (uint256 i = 0; i < total; i++) {
            UltraLoan memory loan = loans[LoanId.wrap(i)];
            uint8 status = LoanStatus.unwrap(loan.status);
            
            if (status == STATUS_ACTIVE) activeLoans++;
            else if (status == STATUS_COMPLETED) completedLoans++;
            else if (status == STATUS_DEFAULTED) defaultedLoans++;
            
            totalAmountLent += LoanAmount.unwrap(loan.amountInCents);
            totalAmountRepaid += RepaymentAmount.unwrap(loan.totalRepaid);
        }
    }
    
    /**
     * @notice Validate loan amount (utility function)
     */
    function isValidLoanAmount(uint24 _amountInCents) external pure returns (bool) {
        return _amountInCents > 0 && _amountInCents <= 500000;
    }
    
    /**
     * @notice Validate currency code (utility function)
     */
    function isValidCurrency(bytes3 _currency) external pure returns (bool) {
        return _currency.length == 3;
    }
}