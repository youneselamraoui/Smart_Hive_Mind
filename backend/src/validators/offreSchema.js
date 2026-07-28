const { z } = require("zod");

const createOffreSchema = z.object({
    type: z.enum(["emploi", "stage"], {
        required_error: "Le type d'offre est requis.",
        invalid_type_error: "Type invalide. Valeurs acceptees: emploi, stage.",
    }),
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    exigences: z.array(z.string().trim()).optional(),
});

module.exports = { createOffreSchema };
