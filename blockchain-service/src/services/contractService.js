const { ethers } = require("ethers");
const abi = require("../abi/ProofRegistry.json").abi;

let contract;

function ensureContract() {
    if (contract) return;
    const address = process.env.CONTRACT_ADDRESS;
    if (!address || address === "0x0000000000000000000000000000000000000000") {
        const err = new Error("CONTRACT_ADDRESS not configured. Deploy the contract first.");
        err.statusCode = 503;
        throw err;
    }
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    contract = new ethers.Contract(address, abi, wallet);
}

async function anchorProof(hash) {
    ensureContract();
    if (!ethers.isHexString(hash, 32)) {
        const err = new Error("Invalid hash: must be a 32-byte hex string (0x...)");
        err.statusCode = 400;
        throw err;
    }
    const tx = await contract.anchorProof(hash);
    const receipt = await tx.wait();
    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
    };
}

async function verifyProof(hash) {
    ensureContract();
    if (!ethers.isHexString(hash, 32)) {
        const err = new Error("Invalid hash: must be a 32-byte hex string (0x...)");
        err.statusCode = 400;
        throw err;
    }
    const [submitter, timestamp, exists] = await contract.verifyProof(hash);
    return {
        submitter,
        timestamp: Number(timestamp),
        exists,
    };
}

module.exports = { anchorProof, verifyProof };
