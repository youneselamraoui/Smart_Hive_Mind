const { z } = require("zod");

const inscrireMembreSchema = z.object({
    evenementId: z
        .string({ required_error: "L'ID de l'evenement est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID evenement invalide."),
});

module.exports = { inscrireMembreSchema };
