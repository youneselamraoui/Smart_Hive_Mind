const crypto = require("crypto");

function internalAuth(req, res, next) {
    const key = req.headers["x-internal-key"];
    const expected = process.env.INTERNAL_SERVICE_KEY;

    if (!key || !expected) {
        return res.status(401).json({ error: "Acces interne refuse : cle manquante." });
    }

    if (key.length !== expected.length) {
        return res.status(401).json({ error: "Acces interne refuse : cle invalide." });
    }

    try {
        const match = crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected));
        if (!match) {
            return res.status(401).json({ error: "Acces interne refuse : cle invalide." });
        }
    } catch {
        return res.status(401).json({ error: "Acces interne refuse : erreur de verification." });
    }

    next();
}

module.exports = internalAuth;
