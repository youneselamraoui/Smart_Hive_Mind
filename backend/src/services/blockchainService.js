const crypto = require("crypto");

const BLOCKCHAIN_SERVICE_URL =
    process.env.BLOCKCHAIN_SERVICE_URL || "http://blockchain-service:4000";

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Ancrer un contenu sur la blockchain.
 * Retourne { preuve, hash }.
 * En cas d'echec, jette une erreur avec les proprietes :
 *   .status    — code HTTP a renvoyer
 *   .detail    — message technique du service (si disponible)
 *   .preuve    — objet preuve avec statut "echec"
 */
async function anchorContent(contenu) {
    const hash = crypto.createHash("sha256").update(contenu).digest("hex");
    const hashContenu = `0x${hash}`;

    try {
        const anchorRes = await fetchWithTimeout(`${BLOCKCHAIN_SERVICE_URL}/anchor`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hash: hashContenu }),
        });

        if (!anchorRes.ok) {
            const errBody = await anchorRes.json().catch(() => ({}));
            const err = new Error("Echec de l'ancrage blockchain.");
            err.status = 502;
            err.detail = errBody.error || "Service blockchain injoignable.";
            err.preuve = { hash: hashContenu, statut: "echec" };
            throw err;
        }

        const { txHash, blockNumber } = await anchorRes.json();
        return {
            hashContenu,
            preuve: { hash: hashContenu, txHash, blockNumber, statut: "ancre" },
        };
    } catch (err) {
        if (err.status) throw err; // deja structuree

        const wrapped = new Error("Echec de l'ancrage blockchain.");
        wrapped.status = 502;
        wrapped.detail =
            err.name === "AbortError"
                ? "TimeOut : le service blockchain n'a pas repondu dans les 8s."
                : "Service blockchain injoignable.";
        wrapped.preuve = { hash: hashContenu, statut: "echec" };
        throw wrapped;
    }
}

module.exports = { anchorContent, BLOCKCHAIN_SERVICE_URL, TIMEOUT_MS };
