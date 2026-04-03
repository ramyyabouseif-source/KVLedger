// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LoanRegistryOptimized
 * @notice Gas-optimized version of the microlending contract
 * @dev Optimizations: packed structs, events over storage, batch operations
 */
contract LoanRegistryOptimized {
    
    // ============================================
    // OPTIMIZED STATE VARIABLES
    // ============================================
    
    address public admin;
    uint256 public loanCount;
    
    // Packed struct for gas efficiency
    struct Loan {
        uint256 id;                    // 32 bytes
        bytes32 borrowerHash;          // 32 bytes
        uint128 amountInCents;         // 16 bytes (max: $340 billion)
        uint128 totalRepaid;           // 16 bytes (max: $340 billion)
        uint32 disbursedAt;            // 4 bytes (timestamp until 2106)
        uint32 dueDate;                // 4 bytes (timestamp until 2106)
        LoanStatus status;             // 1 byte
        bytes3 currency;               // 3 bytes (USD, KES, UGX, etc.)
    }
    
    enum LoanStatus {
        Active,      // 0
        Completed,   // 1
        Defaulted    // 2
    }
    
    mapping(uint256 => Loan) public loans;
    
    // ============================================
    // OPTIMIZED EVENTS (no storage arrays)
    // ============================================
    
    event LoanCreated(
        uint256 indexed loanId,
        bytes32 indexed borrowerHash,
        uint128 amountInCents,
        uint32 dueDate,
        bytes3 currency
    );
    
    event RepaymentRecorded(
        uint256 indexed loanId,
        uint128 amount,
        uint128 totalRepaid,
        uint128 remainingBalance,
        uint32 timestamp,
        string notes
    );
    
    event LoanCompleted(uint256 indexed loanId, uint32 completedAt);
    event LoanDefaulted(uint256 indexed loanId, uint32 defaultedAt);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier loanExists(uint256 _loanId) {
        require(_loanId < loanCount, "Loan does not exist");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        admin = msg.sender;
        loanCount = 0;
    }
    
    // ============================================
    // OPTIMIZED CORE FUNCTIONS
    // ============================================
    
    /**
     * @notice Create a single loan (optimized)
     */
    function createLoan(
        bytes32 _borrowerHash,
        uint128 _amountInCents,
        uint32 _durationDays,
        bytes3 _currency
    ) external onlyAdmin returns (uint256) {
        return _createLoan(_borrowerHash, _amountInCents, _durationDays, _currency);
    }
    
    /**
     * @notice Create multiple loans in one transaction (gas efficient)
     */
    function createMultipleLoans(
        bytes32[] calldata _borrowerHashes,
        uint128[] calldata _amounts,
        uint32[] calldata _durations,
        bytes3[] calldata _currencies
    ) external onlyAdmin returns (uint256[] memory) {
        require(_borrowerHashes.length == _amounts.length, "Array length mismatch");
        require(_amounts.length == _durations.length, "Array length mismatch");
        require(_durations.length == _currencies.length, "Array length mismatch");
        require(_borrowerHashes.length <= 50, "Too many loans"); // Prevent gas limit
        
        uint256[] memory loanIds = new uint256[](_borrowerHashes.length);
        
        for (uint256 i = 0; i < _borrowerHashes.length; i++) {
            loanIds[i] = _createLoan(
                _borrowerHashes[i],
                _amounts[i],
                _durations[i],
                _currencies[i]
            );
        }
        
        return loanIds;
    }
    
    /**
     * @notice Internal function to create a loan (reused by batch function)
     */
    function _createLoan(
        bytes32 _borrowerHash,
        uint128 _amountInCents,
        uint32 _durationDays,
        bytes3 _currency
    ) internal returns (uint256) {
        require(_amountInCents > 0, "Amount must be > 0");
        require(_durationDays > 0, "Duration must be > 0");
        require(_currency.length > 0, "Currency required");
        
        uint32 currentTime = uint32(block.timestamp);
        uint32 dueDate = currentTime + (_durationDays * 1 days);
        
        loans[loanCount] = Loan({
            id: loanCount,
            borrowerHash: _borrowerHash,
            amountInCents: _amountInCents,
            totalRepaid: 0,
            disbursedAt: currentTime,
            dueDate: dueDate,
            status: LoanStatus.Active,
            currency: _currency
        });
        
        emit LoanCreated(loanCount, _borrowerHash, _amountInCents, dueDate, _currency);
        
        loanCount++;
        return loanCount - 1;
    }
    
    /**
     * @notice Record repayment (optimized)
     */
    function recordRepayment(
        uint256 _loanId,
        uint128 _amountInCents,
        string calldata _notes
    ) external onlyAdmin loanExists(_loanId) {
        require(_amountInCents > 0, "Amount must be > 0");
        
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        
        loan.totalRepaid += _amountInCents;
        
        uint128 remainingBalance = 0;
        if (loan.totalRepaid < loan.amountInCents) {
            remainingBalance = loan.amountInCents - loan.totalRepaid;
        }
        
        emit RepaymentRecorded(
            _loanId,
            _amountInCents,
            loan.totalRepaid,
            remainingBalance,
            uint32(block.timestamp),
            _notes
        );
        
        if (loan.totalRepaid >= loan.amountInCents) {
            loan.status = LoanStatus.Completed;
            emit LoanCompleted(_loanId, uint32(block.timestamp));
        }
    }
    
    /**
     * @notice Record multiple repayments (gas efficient)
     */
    function recordMultipleRepayments(
        uint256[] calldata _loanIds,
        uint128[] calldata _amounts,
        string[] calldata _notes
    ) external onlyAdmin {
        require(_loanIds.length == _amounts.length, "Array length mismatch");
        require(_amounts.length == _notes.length, "Array length mismatch");
        require(_loanIds.length <= 20, "Too many repayments");
        
        for (uint256 i = 0; i < _loanIds.length; i++) {
            // Call the recordRepayment function directly
            this.recordRepayment(_loanIds[i], _amounts[i], _notes[i]);
        }
    }
    
    /**
     * @notice Mark loan as defaulted
     */
    function markAsDefaulted(uint256 _loanId) external onlyAdmin loanExists(_loanId) {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(block.timestamp > loan.dueDate, "Not overdue");
        
        loan.status = LoanStatus.Defaulted;
        emit LoanDefaulted(_loanId, uint32(block.timestamp));
    }
    
    // ============================================
    // VIEW FUNCTIONS (unchanged)
    // ============================================
    
    function getLoanDetails(uint256 _loanId) external view loanExists(_loanId) returns (Loan memory) {
        return loans[_loanId];
    }
    
    function getRemainingBalance(uint256 _loanId) external view loanExists(_loanId) returns (uint128) {
        Loan memory loan = loans[_loanId];
        if (loan.totalRepaid >= loan.amountInCents) {
            return 0;
        }
        return loan.amountInCents - loan.totalRepaid;
    }
    
    function isOverdue(uint256 _loanId) external view loanExists(_loanId) returns (bool) {
        Loan memory loan = loans[_loanId];
        return (loan.status == LoanStatus.Active && block.timestamp > loan.dueDate);
    }
    
    function getTotalLoans() external view returns (uint256) {
        return loanCount;
    }
    
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin");
        admin = _newAdmin;
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * @notice Get loan summary (gas efficient for frontend)
     */
    function getLoanSummary(uint256 _loanId) external view loanExists(_loanId) returns (
        uint256 id,
        uint128 amount,
        uint128 repaid,
        uint128 remaining,
        uint8 status,
        bytes3 currency
    ) {
        Loan memory loan = loans[_loanId];
        return (
            loan.id,
            loan.amountInCents,
            loan.totalRepaid,
            loan.totalRepaid >= loan.amountInCents ? 0 : loan.amountInCents - loan.totalRepaid,
            uint8(loan.status),
            loan.currency
        );
    }
    
    /**
     * @notice Get multiple loan summaries (batch read)
     */
    function getLoanSummaries(uint256[] calldata _loanIds) external view returns (
        uint256[] memory ids,
        uint128[] memory amounts,
        uint128[] memory repaid,
        uint128[] memory remaining,
        uint8[] memory statuses,
        bytes3[] memory currencies
    ) {
        uint256 length = _loanIds.length;
        require(length <= 100, "Too many loans");
        
        ids = new uint256[](length);
        amounts = new uint128[](length);
        repaid = new uint128[](length);
        remaining = new uint128[](length);
        statuses = new uint8[](length);
        currencies = new bytes3[](length);
        
        for (uint256 i = 0; i < length; i++) {
            require(_loanIds[i] < loanCount, "Loan does not exist");
            Loan memory loan = loans[_loanIds[i]];
            
            ids[i] = loan.id;
            amounts[i] = loan.amountInCents;
            repaid[i] = loan.totalRepaid;
            remaining[i] = loan.totalRepaid >= loan.amountInCents ? 0 : loan.amountInCents - loan.totalRepaid;
            statuses[i] = uint8(loan.status);
            currencies[i] = loan.currency;
        }
    }
}