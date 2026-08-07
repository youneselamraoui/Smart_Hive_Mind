const crypto = require("crypto");

const BLOCKCHAIN_SERVICE_URL =
    process.env.BLOCKCHAIN_SERVICE_URL || "http://blockchain-service:4000";

// Timeout par defaut (lecture / verification) : 8s.
// La verification est une simple lecture on-chain (view), donc rapide.
const TIMEOUT_MS = 8000;

// Timeout dedie a l'ancrage (ecriture d'une transaction on-chain).
// Un ancrage reel sur Sepolia prend couramment ~10s et peut depasser 15s
// selon la charge du reseau (attente du receipt de confirmation). Un
// timeout trop court provoquerait des 502 sur des ancrages qui ont en
// fait reussi. On laisse donc une marge confortable de 20s.
const ANCHOR_TIMEOUT_MS = 20000;

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
        const anchorRes = await fetchWithTimeout(
            `${BLOCKCHAIN_SERVICE_URL}/anchor`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hash: hashContenu }),
            },
            ANCHOR_TIMEOUT_MS
        );

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
                ? `TimeOut : le service blockchain n'a pas repondu dans les ${ANCHOR_TIMEOUT_MS / 1000}s.`
                : "Service blockchain injoignable.";
        wrapped.preuve = { hash: hashContenu, statut: "echec" };
        throw wrapped;
    }
}

/**
 * Ancrer une entite de n'importe quel type sur la blockchain.
 * @param {"publication"|"contribution"|"idee"} typeEntite
 * @param {string} entiteId - _id de l'entite
 * @param {string} contenu - contenu a hasher et ancrer
 * @returns {Promise<{hashContenu, preuve}>}
 */
async function anchorEntity(typeEntite, entiteId, contenu) {
    const { hashContenu, preuve } = await anchorContent(contenu);
    const preuveAvecType = { ...preuve, typeEntite };

    // Le type "livrable" n'est pas encore dans ModelMap car aucun modele Livrable dedie n'existe.
    // Lorsqu'il sera cree, l'ajouter ici et dans l'enum de preuveSchema.js.
    const ModelMap = {
        publication: require("../models/Publication"),
        contribution: require("../models/TacheCrowdsourcing"),
        idee: require("../models/Idee"),
    };

    const Model = ModelMap[typeEntite];
    if (!Model) {
        const err = new Error("Type d'entite inconnu pour l'ancrage blockchain.");
        err.status = 400;
        throw err;
    }

    const updateFields = { preuve: preuveAvecType };
    if (typeEntite === "publication") {
        updateFields.hashContenu = hashContenu;
    }

    const updateResult = await Model.findByIdAndUpdate(
        entiteId,
        updateFields,
        { new: true, runValidators: true }
    );

    if (!updateResult) {
        const err = new Error("Entite introuvable pour l'ancrage blockchain.");
        err.status = 404;
        throw err;
    }

    if (typeEntite === "publication") {
        const ProfilCertifie = require("../models/ProfilCertifie");
        const auteurId = updateResult.auteur;
        if (auteurId) {
            const profilPubs = await ProfilCertifie.findOneAndUpdate(
                { membreId: auteurId },
                { $addToSet: { oeuvresProuvees: { publicationId: entiteId } } }
            );
            if (!profilPubs) {
                await ProfilCertifie.create({
                    membreId: auteurId,
                    oeuvresProuvees: [{ publicationId: entiteId }],
                });
            }
        }
    }

    return { hashContenu, preuve: preuveAvecType };
}

module.exports = { anchorContent, anchorEntity, BLOCKCHAIN_SERVICE_URL, TIMEOUT_MS, ANCHOR_TIMEOUT_MS };
