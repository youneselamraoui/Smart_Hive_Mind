function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    console.error("[Erreur non geree]", req.method, req.originalUrl, err);
    res.status(err.status || 500).json({ error: "Erreur interne du serveur." });
}

module.exports = errorHandler;
