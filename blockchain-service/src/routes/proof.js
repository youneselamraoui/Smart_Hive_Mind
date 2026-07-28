const { Router } = require("express");
const contractService = require("../services/contractService");

const router = Router();

router.post("/anchor", async (req, res) => {
    try {
        const { hash } = req.body;
        const result = await contractService.anchorProof(hash);
        res.json({
            ...result,
            etherscanUrl: `https://sepolia.etherscan.io/tx/${result.txHash}`,
        });
    } catch (err) {
        if (err.statusCode === 400) {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === "NETWORK_ERROR" || err.code === "TIMEOUT") {
            return res.status(503).json({
                error: "Blockchain RPC unreachable. Please try again later.",
            });
        }
        if (err.code === "INSUFFICIENT_FUNDS" || err.code === "CALL_EXCEPTION") {
            return res.status(422).json({
                error: "Transaction failed: insufficient funds or contract rejection.",
            });
        }
        if (err.reason === "Proof already exists") {
            return res.status(409).json({ error: "Proof already exists for this hash." });
        }
        if (err.code === "CALL_EXCEPTION") {
            return res.status(422).json({
                error: "Contract call failed. Verify the contract is deployed.",
            });
        }
        res.status(500).json({ error: "Internal server error." });
    }
});

router.get("/verify/:hash", async (req, res) => {
    try {
        const { hash } = req.params;
        const result = await contractService.verifyProof(hash);
        if (!result.exists) {
            return res.status(404).json({ error: "No proof found for this hash." });
        }
        res.json({
            ...result,
            etherscanUrl: `https://sepolia.etherscan.io/address/${result.submitter}`,
        });
    } catch (err) {
        if (err.statusCode === 400) {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === "NETWORK_ERROR" || err.code === "TIMEOUT") {
            return res.status(503).json({
                error: "Blockchain RPC unreachable. Please try again later.",
            });
        }
        if (err.code === "CALL_EXCEPTION") {
            return res.status(422).json({
                error: "Contract call failed. Verify the contract is deployed.",
            });
        }
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
