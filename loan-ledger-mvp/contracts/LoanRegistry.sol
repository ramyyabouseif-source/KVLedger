// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LoanRegistry
 * @notice A simple smart contract to record microloans and repayments
 * @dev This is an educational MVP - focusing on transparency and simplicity
 * 
 * KEY CONCEPTS:
 * - Smart contracts are like vending machines: deterministic rules, no middleman
 * - Everything stored here is public and immutable (can't be changed)
 * - We use "events" to emit logs that frontends can listen to
 */
contract LoanRegistry {
    
    // ============================================
    // STATE VARIABLES (stored on blockchain)
    // ============================================
    
    /**
     * @dev Address of the contract owner (typically the nonprofit admin)
     * Only this address can create loans in our MVP
     */
    address public admin;
    
    /**
     * @dev Counter to generate unique loan IDs
     * Starts at 0 and increments with each new loan
     */
    uint256 public loanCount;
    
    /**
     * @dev Struct defines the structure of a Loan
     * Think of it like a database table schema
     */
    struct Loan {
        uint256 id;                    // Unique loan identifier
        bytes32 borrowerHash;          // Anonymized borrower ID (hash of their real ID)
        uint256 amountInCents;         // Loan amount in cents (avoid decimals)
        uint256 disbursedAt;           // Timestamp when loan was given
        uint256 dueDate;               // When loan should be fully repaid
        uint256 totalRepaid;           // Running total of repayments
        LoanStatus status;             // Current loan status
        string currency;               // e.g., "USD", "KES", "UGX"
    }
    
    /**
     * @dev Enum defines possible loan states
     * Enums are like multiple choice - loan must be in ONE of these states
     */
    enum LoanStatus {
        Active,      // 0 - Loan is active, repayments ongoing
        Completed,   // 1 - Fully repaid
        Defaulted    // 2 - Overdue and marked as default
    }
    
    /**
     * @dev Mapping is like a hash table: key => value
     * This maps loan ID to Loan struct
     * Example: loans[1] returns the Loan with id=1
     */
    mapping(uint256 => Loan) public loans;
    
    /**
     * @dev Track repayment history for each loan
     * loanId => array of repayment amounts
     */
    mapping(uint256 => Repayment[]) public repaymentHistory;
    
    /**
     * @dev Struct for individual repayments
     */
    struct Repayment {
        uint256 amount;
        uint256 timestamp;
        string notes;
    }
    
    // ============================================
    // EVENTS (logs emitted for transparency)
    // ============================================
    
    /**
     * @dev Events are like receipts - they create logs on the blockchain
     * Frontends listen to these events to update the UI in real-time
     * They're also searchable in block explorers
     */
    event LoanCreated(
        uint256 indexed loanId,
        bytes32 indexed borrowerHash,
        uint256 amountInCents,
        uint256 dueDate,
        string currency
    );
    
    event RepaymentRecorded(
        uint256 indexed loanId,
        uint256 amount,
        uint256 totalRepaid,
        uint256 remainingBalance
    );
    
    event LoanCompleted(
        uint256 indexed loanId,
        uint256 completedAt
    );
    
    event LoanDefaulted(
        uint256 indexed loanId,
        uint256 defaultedAt
    );
    
    // ============================================
    // MODIFIERS (reusable access control)
    // ============================================
    
    /**
     * @dev Modifier restricts function access to admin only
     * Usage: Add "onlyAdmin" to any function that should be admin-only
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;  // This is where the function body gets inserted
    }
    
    /**
     * @dev Modifier checks if a loan exists
     */
    modifier loanExists(uint256 _loanId) {
        require(_loanId < loanCount, "Loan does not exist");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR (runs once when contract is deployed)
    // ============================================
    
    /**
     * @dev Constructor sets the deployer as admin
     * msg.sender is the address calling this function (deployer)
     */
    constructor() {
        admin = msg.sender;
        loanCount = 0;
    }
    
    // ============================================
    // CORE FUNCTIONS
    // ============================================
    
    /**
     * @notice Create a new loan record
     * @dev Only admin can create loans in this MVP
     * 
     * @param _borrowerHash Anonymized borrower identifier (keccak256 hash)
     * @param _amountInCents Loan amount in cents (e.g., $100 = 10000 cents)
     * @param _durationDays How many days until loan is due
     * @param _currency Currency code (e.g., "USD", "KES")
     * @return loanId The ID of the newly created loan
     * 
     * TEACHING NOTE: Why hash the borrower ID?
     * - Protects privacy on public blockchain
     * - Still allows tracking across multiple loans (same hash = same person)
     * - Off-chain database maps hash to real identity
     */
    function createLoan(
        bytes32 _borrowerHash,
        uint256 _amountInCents,
        uint256 _durationDays,
        string memory _currency
    ) 
        public 
        onlyAdmin 
        returns (uint256) 
    {
        // Input validation
        require(_amountInCents > 0, "Loan amount must be greater than 0");
        require(_durationDays > 0, "Duration must be greater than 0");
        require(bytes(_currency).length > 0, "Currency cannot be empty");
        
        // Calculate due date
        uint256 dueDate = block.timestamp + (_durationDays * 1 days);
        
        // Create loan struct in storage
        loans[loanCount] = Loan({
            id: loanCount,
            borrowerHash: _borrowerHash,
            amountInCents: _amountInCents,
            disbursedAt: block.timestamp,  // block.timestamp = current Unix time
            dueDate: dueDate,
            totalRepaid: 0,
            status: LoanStatus.Active,
            currency: _currency
        });
        
        // Emit event for transparency
        emit LoanCreated(
            loanCount,
            _borrowerHash,
            _amountInCents,
            dueDate,
            _currency
        );
        
        // Increment counter and return new loan ID
        loanCount++;
        return loanCount - 1;
    }
    
    /**
     * @notice Record a repayment for a loan
     * @dev Anyone can call this (admin records on behalf of borrower)
     * 
     * @param _loanId The loan ID receiving the repayment
     * @param _amountInCents Repayment amount in cents
     * @param _notes Optional notes about this repayment
     * 
     * TEACHING NOTE: Why allow overpayment?
     * - Sometimes repayments include future installments
     * - Keeps contract simple and flexible
     * - Frontend can show "overpaid" status
     */
    function recordRepayment(
        uint256 _loanId,
        uint256 _amountInCents,
        string memory _notes
    )
        public
        onlyAdmin
        loanExists(_loanId)
    {
        require(_amountInCents > 0, "Repayment amount must be greater than 0");
        
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan is not active");
        
        // Add repayment to history
        repaymentHistory[_loanId].push(Repayment({
            amount: _amountInCents,
            timestamp: block.timestamp,
            notes: _notes
        }));
        
        // Update total repaid
        loan.totalRepaid += _amountInCents;
        
        // Calculate remaining balance
        uint256 remainingBalance = 0;
        if (loan.totalRepaid < loan.amountInCents) {
            remainingBalance = loan.amountInCents - loan.totalRepaid;
        }
        
        // Emit repayment event
        emit RepaymentRecorded(
            _loanId,
            _amountInCents,
            loan.totalRepaid,
            remainingBalance
        );
        
        // Check if loan is fully repaid
        if (loan.totalRepaid >= loan.amountInCents) {
            loan.status = LoanStatus.Completed;
            emit LoanCompleted(_loanId, block.timestamp);
        }
    }
    
    /**
     * @notice Mark a loan as defaulted
     * @dev Only admin can mark defaults
     * @param _loanId The loan ID to mark as defaulted
     */
    function markAsDefaulted(uint256 _loanId) 
        public 
        onlyAdmin 
        loanExists(_loanId) 
    {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan is not active");
        require(block.timestamp > loan.dueDate, "Loan is not yet overdue");
        
        loan.status = LoanStatus.Defaulted;
        emit LoanDefaulted(_loanId, block.timestamp);
    }
    
    // ============================================
    // VIEW FUNCTIONS (read-only, no gas cost)
    // ============================================
    
    /**
     * @notice Get complete loan details
     * @param _loanId The loan ID to query
     * @return Loan struct with all details
     * 
     * TEACHING NOTE: "view" functions don't modify state
     * - They're free to call (no gas needed)
     * - Can be called from frontend without transactions
     */
    function getLoanDetails(uint256 _loanId) 
        public 
        view 
        loanExists(_loanId)
        returns (Loan memory) 
    {
        return loans[_loanId];
    }
    
    /**
     * @notice Get repayment history for a loan
     * @param _loanId The loan ID to query
     * @return Array of Repayment structs
     */
    function getRepaymentHistory(uint256 _loanId)
        public
        view
        loanExists(_loanId)
        returns (Repayment[] memory)
    {
        return repaymentHistory[_loanId];
    }
    
    /**
     * @notice Get remaining balance on a loan
     * @param _loanId The loan ID to query
     * @return Remaining balance in cents
     */
    function getRemainingBalance(uint256 _loanId)
        public
        view
        loanExists(_loanId)
        returns (uint256)
    {
        Loan memory loan = loans[_loanId];
        if (loan.totalRepaid >= loan.amountInCents) {
            return 0;
        }
        return loan.amountInCents - loan.totalRepaid;
    }
    
    /**
     * @notice Check if a loan is overdue
     * @param _loanId The loan ID to check
     * @return true if loan is past due date and not completed
     */
    function isOverdue(uint256 _loanId)
        public
        view
        loanExists(_loanId)
        returns (bool)
    {
        Loan memory loan = loans[_loanId];
        return (
            loan.status == LoanStatus.Active &&
            block.timestamp > loan.dueDate
        );
    }
    
    /**
     * @notice Get total number of loans across all statuses
     * @return Total count of loans created
     */
    function getTotalLoans() public view returns (uint256) {
        return loanCount;
    }
    
    /**
     * @notice Transfer admin role (use carefully!)
     * @dev Only current admin can transfer ownership
     * @param _newAdmin Address of new admin
     */
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "New admin cannot be zero address");
        admin = _newAdmin;
    }
}