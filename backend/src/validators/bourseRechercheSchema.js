const { z } = require("zod");

const createBourseRechercheSchema = z.object({
    montant: z
        .number({ required_error: "Le montant est requis." })
        .positive("Le montant doit etre positif."),
    criteres: z.array(z.string().trim()).optional(),
});

module.exports = { createBourseRechercheSchema };
