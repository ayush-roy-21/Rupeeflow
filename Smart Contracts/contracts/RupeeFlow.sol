// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RupeeFlow
 * @dev Cross-border remittance platform smart contract
 * @notice Handles international money transfers using stablecoins
 * @author RupeeFlow Team
 */
contract RupeeFlow is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    // ============ CONSTANTS ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    uint256 public constant MAX_FEE_BPS = 200; // 2% maximum fee
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // ============ STATE VARIABLES ============
    
    Counters.Counter private _transferIds;
    
    // Fee configuration
    uint256 public feeBps = 150; // 1.5% default fee
    
    // Supported stablecoins
    mapping(address => bool) public supportedStablecoins;
    
    // Transfer storage
    mapping(uint256 => Transfer) public transfers;
    mapping(address => uint256[]) public userTransfers;
    
    // Oracle and ramp addresses
    address public fxOracle;
    address public onRampProvider;
    address public offRampProvider;
    
    // Treasury address for fee collection
    address public treasury;
    
    // ============ STRUCTS ============
    
    struct Transfer {
        uint256 id;
        address sender;
        address recipient;
        uint256 amount;
        address stablecoin;
        string sourceCurrency;
        string destinationCurrency;
        string sourceCountry;
        string destinationCountry;
        uint256 exchangeRate;
        uint256 feeAmount;
        TransferStatus status;
        uint256 createdAt;
        uint256 completedAt;
        string blockchainTxHash;
        string recipientDetails; // Encrypted recipient info
    }
    
    enum TransferStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Cancelled,
        Refunded
    }
    
    // ============ EVENTS ============
    
    event TransferInitiated(
        uint256 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        address stablecoin,
        string sourceCurrency,
        string destinationCurrency,
        uint256 feeAmount
    );
    
    event TransferCompleted(
        uint256 indexed transferId,
        address indexed recipient,
        uint256 amount,
        string blockchainTxHash
    );
    
    event TransferFailed(
        uint256 indexed transferId,
        string reason
    );
    
    event TransferRefunded(
        uint256 indexed transferId,
        address indexed sender,
        uint256 amount
    );
    
    event FeeUpdated(
        uint256 oldFeeBps,
        uint256 newFeeBps
    );
    
    event OracleUpdated(
        address oldOracle,
        address newOracle
    );
    
    event RampProviderUpdated(
        string providerType,
        address oldProvider,
        address newProvider
    );
    
    event TreasuryUpdated(
        address oldTreasury,
        address newTreasury
    );
    
    event StablecoinAdded(
        address stablecoin,
        string symbol
    );
    
    event StablecoinRemoved(
        address stablecoin
    );
    
    // ============ MODIFIERS ============
    
    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "RupeeFlow: operator role required");
        _;
    }
    
    modifier onlyCompliance() {
        require(hasRole(COMPLIANCE_ROLE, msg.sender), "RupeeFlow: compliance role required");
        _;
    }
    
    modifier validStablecoin(address stablecoin) {
        require(supportedStablecoins[stablecoin], "RupeeFlow: unsupported stablecoin");
        _;
    }
    
    modifier validFee(uint256 newFeeBps) {
        require(newFeeBps <= MAX_FEE_BPS, "RupeeFlow: fee too high");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _treasury,
        address _fxOracle,
        address _onRampProvider,
        address _offRampProvider
    ) {
        require(_treasury != address(0), "RupeeFlow: invalid treasury");
        require(_fxOracle != address(0), "RupeeFlow: invalid oracle");
        require(_onRampProvider != address(0), "RupeeFlow: invalid on-ramp");
        require(_offRampProvider != address(0), "RupeeFlow: invalid off-ramp");
        
        treasury = _treasury;
        fxOracle = _fxOracle;
        onRampProvider = _onRampProvider;
        offRampProvider = _offRampProvider;
        
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        
        // Add default stablecoins (USDC, USDT)
        // NOTE: removed hardcoded placeholder addresses (invalid literal length).
        // Add stablecoins using addStablecoin(...) after deployment with valid 20-byte addresses.
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Initiate a new transfer
     * @param recipient Recipient address
     * @param amount Transfer amount in stablecoin
     * @param stablecoin Stablecoin contract address
     * @param sourceCurrency Source currency code (e.g., "INR")
     * @param destinationCurrency Destination currency code (e.g., "RUB")
     * @param sourceCountry Source country code (e.g., "IN")
     * @param destinationCountry Destination country code (e.g., "RU")
     * @param recipientDetails Encrypted recipient information
     */
    function initiateTransfer(
        address recipient,
        uint256 amount,
        address stablecoin,
        string calldata sourceCurrency,
        string calldata destinationCurrency,
        string calldata sourceCountry,
        string calldata destinationCountry,
        string calldata recipientDetails
    ) external whenNotPaused nonReentrant validStablecoin(stablecoin) {
        require(recipient != address(0), "RupeeFlow: invalid recipient");
        require(amount > 0, "RupeeFlow: invalid amount");
        require(bytes(sourceCurrency).length > 0, "RupeeFlow: invalid source currency");
        require(bytes(destinationCurrency).length > 0, "RupeeFlow: invalid destination currency");
        
        // Calculate fees
        uint256 feeAmount = (amount * feeBps) / FEE_DENOMINATOR;
        uint256 netAmount = amount - feeAmount;
        
        // Transfer stablecoins from sender to contract
        IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to treasury
        IERC20(stablecoin).safeTransfer(treasury, feeAmount);
        
        // Create transfer record
        uint256 transferId = _transferIds.current();
        _transferIds.increment();
        
        transfers[transferId] = Transfer({
            id: transferId,
            sender: msg.sender,
            recipient: recipient,
            amount: netAmount,
            stablecoin: stablecoin,
            sourceCurrency: sourceCurrency,
            destinationCurrency: destinationCurrency,
            sourceCountry: sourceCountry,
            destinationCountry: destinationCountry,
            exchangeRate: 0, // Will be set by oracle
            feeAmount: feeAmount,
            status: TransferStatus.Pending,
            createdAt: block.timestamp,
            completedAt: 0,
            blockchainTxHash: "",
            recipientDetails: recipientDetails
        });
        
        userTransfers[msg.sender].push(transferId);
        userTransfers[recipient].push(transferId);
        
        emit TransferInitiated(
            transferId,
            msg.sender,
            recipient,
            netAmount,
            stablecoin,
            sourceCurrency,
            destinationCurrency,
            feeAmount
        );
    }
    
    /**
     * @dev Complete a transfer (called by operator after off-ramp)
     * @param transferId Transfer ID to complete
     * @param blockchainTxHash Blockchain transaction hash
     */
    function completeTransfer(
        uint256 transferId,
        string calldata blockchainTxHash
    ) external onlyOperator whenNotPaused {
        Transfer storage transfer = transfers[transferId];
        require(transfer.id == transferId, "RupeeFlow: transfer not found");
        require(transfer.status == TransferStatus.Pending, "RupeeFlow: invalid status");
        require(bytes(blockchainTxHash).length > 0, "RupeeFlow: invalid tx hash");
        
        transfer.status = TransferStatus.Completed;
        transfer.completedAt = block.timestamp;
        transfer.blockchainTxHash = blockchainTxHash;
        
        // Transfer stablecoins to off-ramp provider
        IERC20(transfer.stablecoin).safeTransfer(offRampProvider, transfer.amount);
        
        emit TransferCompleted(
            transferId,
            transfer.recipient,
            transfer.amount,
            blockchainTxHash
        );
    }
    
    /**
     * @dev Mark transfer as failed
     * @param transferId Transfer ID to mark as failed
     * @param reason Failure reason
     */
    function failTransfer(
        uint256 transferId,
        string calldata reason
    ) external onlyOperator whenNotPaused {
        Transfer storage transfer = transfers[transferId];
        require(transfer.id == transferId, "RupeeFlow: transfer not found");
        require(transfer.status == TransferStatus.Pending, "RupeeFlow: invalid status");
        
        transfer.status = TransferStatus.Failed;
        
        // Refund stablecoins to sender
        IERC20(transfer.stablecoin).safeTransfer(transfer.sender, transfer.amount);
        
        emit TransferFailed(transferId, reason);
    }
    
    /**
     * @dev Refund a transfer (emergency function)
     * @param transferId Transfer ID to refund
     */
    function refundTransfer(
        uint256 transferId
    ) external onlyCompliance whenNotPaused {
        Transfer storage transfer = transfers[transferId];
        require(transfer.id == transferId, "RupeeFlow: transfer not found");
        require(
            transfer.status == TransferStatus.Pending || 
            transfer.status == TransferStatus.Processing,
            "RupeeFlow: cannot refund"
        );
        
        transfer.status = TransferStatus.Refunded;
        
        // Refund stablecoins to sender
        IERC20(transfer.stablecoin).safeTransfer(transfer.sender, transfer.amount);
        
        emit TransferRefunded(transferId, transfer.sender, transfer.amount);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update fee percentage
     * @param newFeeBps New fee in basis points
     */
    function setFeeBps(uint256 newFeeBps) external onlyOperator validFee(newFeeBps) {
        uint256 oldFeeBps = feeBps;
        feeBps = newFeeBps;
        
        emit FeeUpdated(oldFeeBps, newFeeBps);
    }
    
    /**
     * @dev Update FX oracle address
     * @param newOracle New oracle address
     */
    function setOracle(address newOracle) external onlyOperator {
        require(newOracle != address(0), "RupeeFlow: invalid oracle");
        
        address oldOracle = fxOracle;
        fxOracle = newOracle;
        
        emit OracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @dev Update ramp provider addresses
     * @param providerType Provider type ("onRamp" or "offRamp")
     * @param newProvider New provider address
     */
    function setRampProvider(
        string calldata providerType,
        address newProvider
    ) external onlyOperator {
        require(newProvider != address(0), "RupeeFlow: invalid provider");
        
        if (keccak256(bytes(providerType)) == keccak256(bytes("onRamp"))) {
            address oldProvider = onRampProvider;
            onRampProvider = newProvider;
            emit RampProviderUpdated("onRamp", oldProvider, newProvider);
        } else if (keccak256(bytes(providerType)) == keccak256(bytes("offRamp"))) {
            address oldProvider = offRampProvider;
            offRampProvider = newProvider;
            emit RampProviderUpdated("offRamp", oldProvider, newProvider);
        } else {
            revert("RupeeFlow: invalid provider type");
        }
    }
    
    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOperator {
        require(newTreasury != address(0), "RupeeFlow: invalid treasury");
        
        address oldTreasury = treasury;
        treasury = newTreasury;
        
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @dev Add supported stablecoin
     * @param stablecoin Stablecoin contract address
     * @param symbol Stablecoin symbol
     */
    function addStablecoin(
        address stablecoin,
        string calldata symbol
    ) external onlyOperator {
        require(stablecoin != address(0), "RupeeFlow: invalid stablecoin");
        require(bytes(symbol).length > 0, "RupeeFlow: invalid symbol");
        
        supportedStablecoins[stablecoin] = true;
        
        emit StablecoinAdded(stablecoin, symbol);
    }
    
    /**
     * @dev Remove supported stablecoin
     * @param stablecoin Stablecoin contract address
     */
    function removeStablecoin(address stablecoin) external onlyOperator {
        require(supportedStablecoins[stablecoin], "RupeeFlow: stablecoin not supported");
        
        supportedStablecoins[stablecoin] = false;
        
        emit StablecoinRemoved(stablecoin);
    }
    
    /**
     * @dev Pause contract (emergency stop)
     */
    function pause() external onlyCompliance {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyCompliance {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get transfer details
     * @param transferId Transfer ID
     * @return Transfer struct
     */
    function getTransfer(uint256 transferId) external view returns (Transfer memory) {
        return transfers[transferId];
    }
    
    /**
     * @dev Get user's transfer IDs
     * @param user User address
     * @return Array of transfer IDs
     */
    function getUserTransfers(address user) external view returns (uint256[] memory) {
        return userTransfers[user];
    }
    
    /**
     * @dev Get transfer count
     * @return Total number of transfers
     */
    function getTransferCount() external view returns (uint256) {
        return _transferIds.current();
    }
    
    /**
     * @dev Calculate fee for given amount
     * @param amount Amount to calculate fee for
     * @return Fee amount
     */
    function calculateFee(uint256 amount) external view returns (uint256) {
        return (amount * feeBps) / FEE_DENOMINATOR;
    }
    
    /**
     * @dev Check if address is supported stablecoin
     * @param stablecoin Stablecoin address to check
     * @return True if supported
     */
    function isSupportedStablecoin(address stablecoin) external view returns (bool) {
        return supportedStablecoins[stablecoin];
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _addStablecoin(address stablecoin, string memory symbol) internal {
        supportedStablecoins[stablecoin] = true;
        emit StablecoinAdded(stablecoin, symbol);
    }
    
    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @dev Emergency withdraw stuck tokens
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyCompliance {
        IERC20(token).safeTransfer(treasury, amount);
    }
    
    /**
     * @dev Emergency withdraw ETH
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawETH(uint256 amount) external onlyCompliance {
        payable(treasury).transfer(amount);
    }
    
    // ============ RECEIVE FUNCTION ============
    
    receive() external payable {
        revert("RupeeFlow: ETH not accepted");
    }
}
