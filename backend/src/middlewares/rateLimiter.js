const rateLimit = require("express-rate-limit");

function valeur(env, defaut) {
    const brut = process.env[env];
    const nb = Number(brut);
    return Number.isFinite(nb) && nb > 0 ? nb : defaut;
}

// Limite stricte sur les routes sensibles (brute force, enumeration de comptes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: valeur("AUTH_RATE_LIMIT_MAX", 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de requetes. Reessayez plus tard." },
});

// Limite globale plus large sur toute l'API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: valeur("API_RATE_LIMIT_MAX", 1000),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de requetes. Reessayez plus tard." },
});

module.exports = { authLimiter, apiLimiter };
