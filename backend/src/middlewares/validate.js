function validate(schema) {
    return (req, res, next) => {
        const data = ['GET', 'DELETE'].includes(req.method) ? req.query : req.body;
        const result = schema.safeParse(data);
        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                champ: issue.path.join("."),
                message: issue.message,
            }));
            return res.status(400).json({
                error: "Validation echouee.",
                details,
            });
        }
        if (['GET', 'DELETE'].includes(req.method)) {
            req.query = result.data;
        } else {
            req.body = result.data;
        }
        next();
    };
}

module.exports = validate;
