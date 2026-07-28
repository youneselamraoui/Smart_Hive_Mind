// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofRegistry {
    struct Proof {
        address submitter;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Proof) public proofs;

    event ProofAnchored(
        bytes32 indexed hash,
        address indexed submitter,
        uint256 timestamp
    );

    /// @notice Anchors a cryptographic hash on-chain as proof of existence.
    /// @dev Reverts if the hash has already been anchored.
    /// @param hash The keccak256 (or any) hash to anchor.
    function anchorProof(bytes32 hash) external {
        require(!proofs[hash].exists, "Proof already exists");
        proofs[hash] = Proof({
            submitter: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        emit ProofAnchored(hash, msg.sender, block.timestamp);
    }

    /// @notice Verifies whether a hash has been anchored and returns its details.
    /// @param hash The hash to look up.
    /// @return submitter The address that anchored the hash (zero address if not found).
    /// @return timestamp The block timestamp when the hash was anchored (0 if not found).
    /// @return exists True if the hash exists on-chain.
    function verifyProof(bytes32 hash)
        external
        view
        returns (address submitter, uint256 timestamp, bool exists)
    {
        Proof storage p = proofs[hash];
        return (p.submitter, p.timestamp, p.exists);
    }
}
