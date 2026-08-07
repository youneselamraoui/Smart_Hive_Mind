// GET /api/preuves/verify/:txHash est publique car la verification blockchain
// est par nature publique et verifiable par tous (aucune donnee sensible),
// et permet a quiconque de verifier l'integrite d'une entite sans authentification.

const Publication = require("../models/Publication");
const TacheCrowdsourcing = require("../models/TacheCrowdsourcing");
const Idee = require("../models/Idee");
const { BLOCKCHAIN_SERVICE_URL, TIMEOUT_MS } = require("../services/blockchainService");

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

exports.verifyByTxHash = async (req, res) => {
    try {
        const { txHash } = req.params;

        let entite = await Publication.findOne({ "preuve.txHash": txHash }).populate("auteur", "nom prenom email");
        let type = "publication";

        if (!entite) {
            entite = await TacheCrowdsourcing.findOne({ "preuve.txHash": txHash });
            type = "contribution";
        }
        if (!entite) {
            entite = await Idee.findOne({ "preuve.txHash": txHash }).populate("auteurId", "nom prenom email");
            type = "idee";
        }

        if (!entite) {
            return res.status(404).json({ error: "Aucune entite trouvee avec ce txHash." });
        }

        const hashContenu = entite.hashContenu || (entite.preuve && entite.preuve.hash);
        if (!hashContenu) {
            return res.status(400).json({ error: "Aucun hash associe a cette entite." });
        }

        const formattedHash = hashContenu.startsWith("0x") ? hashContenu : `0x${hashContenu}`;
        const verifyRes = await fetchWithTimeout(`${BLOCKCHAIN_SERVICE_URL}/verify/${formattedHash}`);

        if (!verifyRes.ok) {
            if (verifyRes.status === 404) {
                return res.json({
                    entiteId: entite._id,
                    type,
                    submitter: null,
                    timestamp: null,
                    exists: false,
                    etherscanUrl: null,
                });
            }
            const errBody = await verifyRes.json().catch(() => ({}));
            return res.status(502).json({
                error: "Echec de la verification blockchain.",
                detail: errBody.error || "Service blockchain injoignable.",
            });
        }

        const data = await verifyRes.json();
        res.json({
            entiteId: entite._id,
            type,
            submitter: data.submitter,
            timestamp: data.timestamp,
            exists: data.exists,
            etherscanUrl: data.etherscanUrl,
        });
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({
                error: "TimeOut : le service blockchain n'a pas repondu dans les 8s.",
            });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
