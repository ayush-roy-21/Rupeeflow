// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IAMLModule.sol";
import "../interfaces/ICorridorRegistry.sol";
import "./SanctionsList.sol";
import "../libraries/AMLScoring.sol";

/**
 * @title AMLModule
 * @notice Real-time on-chain AML transaction screening and wallet cluster management.
 */
contract AMLModule is IAMLModule, AccessControl {
    bytes32 public constant AML_OFFICER_ROLE = keccak256("AML_OFFICER_ROLE");
    bytes32 public constant ROUTER_ROLE = keccak256("ROUTER_ROLE");

    SanctionsList public immutable sanctionsList;
    ICorridorRegistry public immutable corridorRegistry;

    mapping(address => uint8) public walletRiskScores;
    mapping(address => uint256) public walletClusterId;
    mapping(uint256 => address[]) private _clusterMembers;
    mapping(uint256 => uint8) public clusterRiskLevel;
    uint256 public nextClusterId = 1;

    // Rolling 24h metrics per wallet
    mapping(address => uint256) public rolling24hTxCount;
    mapping(address => uint256) public rolling24hVolume;
    mapping(address => uint256) public lastScreenTimestamp;

    error SanctionedAddress();

    constructor(address admin, address _sanctionsList, address _corridorRegistry) {
        require(admin != address(0) && _sanctionsList != address(0) && _corridorRegistry != address(0), "Invalid address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(AML_OFFICER_ROLE, admin);
        sanctionsList = SanctionsList(_sanctionsList);
        corridorRegistry = ICorridorRegistry(_corridorRegistry);
    }

    function screenTransaction(
        address sender,
        address recipient,
        uint256 amount,
        bytes32 corridorId
    ) external override onlyRole(ROUTER_ROLE) returns (uint8 riskScore, bool flagged) {
        if (sanctionsList.isSanctioned(sender) || sanctionsList.isSanctioned(recipient)) {
            revert SanctionedAddress();
        }

        if (block.timestamp >= lastScreenTimestamp[sender] + 24 hours) {
            rolling24hTxCount[sender] = 1;
            rolling24hVolume[sender] = amount;
        } else {
            rolling24hTxCount[sender] += 1;
            rolling24hVolume[sender] += amount;
        }
        lastScreenTimestamp[sender] = block.timestamp;

        ICorridorRegistry.Corridor memory corridor = corridorRegistry.getCorridor(corridorId);

        uint8 sanctionsScore = 0;
        uint8 velocityScore = AMLScoring.calculateVelocityScore(
            rolling24hTxCount[sender],
            rolling24hVolume[sender],
            10,
            corridor.reportingThreshold > 0 ? corridor.reportingThreshold * 5 : 50_000e6
        );

        uint256 clusterId = walletClusterId[sender];
        uint8 clusterScore = 0;
        if (clusterId != 0) {
            clusterScore = AMLScoring.calculateClusterScore(clusterRiskLevel[clusterId], _clusterMembers[clusterId].length);
        }

        uint8 amountScore = amount >= corridor.reportingThreshold ? 80 : 10;

        riskScore = AMLScoring.aggregateScore(sanctionsScore, velocityScore, clusterScore, amountScore);
        
        if (riskScore > walletRiskScores[sender]) {
            walletRiskScores[sender] = riskScore;
        }

        flagged = riskScore >= 70 || amount >= corridor.reportingThreshold;

        emit TransactionScreened(bytes32(0), riskScore, flagged);
        return (riskScore, flagged);
    }

    function flagWalletCluster(
        address[] calldata wallets,
        bytes32 reason
    ) external override onlyRole(AML_OFFICER_ROLE) {
        uint256 clusterId = nextClusterId++;
        clusterRiskLevel[clusterId] = 85;

        for (uint256 i = 0; i < wallets.length; i++) {
            walletClusterId[wallets[i]] = clusterId;
            _clusterMembers[clusterId].push(wallets[i]);
            walletRiskScores[wallets[i]] = 85;
            emit WalletAddedToCluster(wallets[i], clusterId);
        }

        emit WalletClusterFlagged(clusterId, wallets, reason);
    }

    function addToCluster(
        address[] calldata wallets,
        uint256 clusterId
    ) external override onlyRole(AML_OFFICER_ROLE) {
        require(clusterId < nextClusterId && clusterId > 0, "Invalid cluster ID");
        uint8 risk = clusterRiskLevel[clusterId];

        for (uint256 i = 0; i < wallets.length; i++) {
            if (walletClusterId[wallets[i]] != clusterId) {
                walletClusterId[wallets[i]] = clusterId;
                _clusterMembers[clusterId].push(wallets[i]);
                if (risk > walletRiskScores[wallets[i]]) {
                    walletRiskScores[wallets[i]] = risk;
                }
                emit WalletAddedToCluster(wallets[i], clusterId);
            }
        }
    }

    function getWalletRiskScore(address wallet) external view override returns (uint8) {
        return walletRiskScores[wallet];
    }

    function getClusterMembers(uint256 clusterId) external view override returns (address[] memory) {
        return _clusterMembers[clusterId];
    }
}
