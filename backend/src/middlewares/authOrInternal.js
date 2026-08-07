const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * Autorise soit la cle interne (X-Internal-Key, appels entre microservices),
 * soit une session utilisateur (cookie JWT).
 * Utilise pour les routes de progression/finalisation d'atelier appelees
 * a la fois par ai-agentic (cle interne) et par le frontend (session).
 */
function authOrInternal(req, res, next) {
    const key = req.headers["x-internal-key"];
    const expected = process.env.INTERNAL_SERVICE_KEY;

    if (key && expected && key.length === expected.length) {
        try {
            if (crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected))) {
                return next();
            }
        } catch {
            // fall through vers la verification JWT
        }
    }

    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: "Authentification requise." });
    }
    try {
        req.membre = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Token invalide ou expiré." });
    }
}

module.exports = authOrInternal;
