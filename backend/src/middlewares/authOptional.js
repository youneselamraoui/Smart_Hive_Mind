const jwt = require("jsonwebtoken");

// Identique a auth.js mais ne refuse jamais : si le token est absent ou
// invalide, req.membre reste indefini et la requete continue anonymement.
function authOptional(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return next();
    }
    try {
        req.membre = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        // token invalide ou expire : poursuivre en anonyme
    }
    next();
}

module.exports = authOptional;
