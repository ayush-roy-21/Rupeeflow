// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title AMLScoring
 * @notice Risk scoring calculation algorithms for AML screening.
 */
library AMLScoring {
    /// @notice Calculates velocity score based on transaction history
    function calculateVelocityScore(
        uint256 txCount,
        uint256 totalVolume,
        uint256 maxExpectedTx,
        uint256 maxExpectedVolume
    ) internal pure returns (uint8) {
        if (maxExpectedTx == 0 || maxExpectedVolume == 0) return 0;
        
        uint256 countRatio = (txCount * 100) / maxExpectedTx;
        uint256 volumeRatio = (totalVolume * 100) / maxExpectedVolume;
        
        uint256 highestRatio = countRatio > volumeRatio ? countRatio : volumeRatio;
        if (highestRatio >= 200) return 100;
        if (highestRatio >= 150) return 80;
        if (highestRatio >= 100) return 50;
        if (highestRatio >= 75) return 25;
        return 10;
    }

    /// @notice Calculates cluster association risk
    function calculateClusterScore(
        uint8 clusterRiskLevel,
        uint256 clusterSize
    ) internal pure returns (uint8) {
        if (clusterSize == 0) return 0;
        uint256 sizeBonus = clusterSize > 10 ? 15 : (clusterSize > 5 ? 10 : 0);
        uint256 total = uint256(clusterRiskLevel) + sizeBonus;
        return total > 100 ? 100 : uint8(total);
    }

    /// @notice Combines individual scores into aggregate risk
    function aggregateScore(
        uint8 sanctionsScore,
        uint8 velocityScore,
        uint8 clusterScore,
        uint8 amountScore
    ) internal pure returns (uint8) {
        // Weights: Sanctions 40%, Cluster 30%, Velocity 20%, Amount 10%
        uint256 weighted = (uint256(sanctionsScore) * 40) +
                           (uint256(clusterScore) * 30) +
                           (uint256(velocityScore) * 20) +
                           (uint256(amountScore) * 10);
        return uint8(weighted / 100);
    }
}
