const { z } = require("zod");

const createBountySchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    description: z
        .string({ required_error: "La description est requise." })
        .min(10, "La description doit contenir au moins 10 caracteres."),
    recompense: z
        .number({ required_error: "La recompense est requise." })
        .positive("La recompense doit etre positive."),
    delai: z.string({ required_error: "Le delai est requis." }),
});

const submitBountySchema = z.object({
    contenuUrl: z
        .string({ required_error: "contenuUrl est requis." })
        .min(1, "contenuUrl ne peut pas etre vide."),
});

module.exports = { createBountySchema, submitBountySchema };
