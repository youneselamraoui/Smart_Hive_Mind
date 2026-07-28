const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: "Authentification requise." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.membre = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "Token invalide ou expiré." });
    }
}

module.exports = auth;
