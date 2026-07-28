function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
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
        req.body = result.data;
        next();
    };
}

module.exports = validate;
