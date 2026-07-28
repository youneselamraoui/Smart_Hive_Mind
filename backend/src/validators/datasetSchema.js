const { z } = require("zod");

const createDatasetSchema = z.object({
    nom: z
        .string({ required_error: "Le nom du dataset est requis." })
        .min(1, "Le nom ne peut pas etre vide."),
    domaine: z
        .string({ required_error: "Le domaine est requis." })
        .min(1, "Le domaine ne peut pas etre vide."),
    qualite: z
        .coerce.number()
        .min(0, "La qualite doit etre entre 0 et 1.")
        .max(1, "La qualite doit etre entre 0 et 1.")
        .optional(),
    annotations: z
        .string()
        .optional(),
    licence: z
        .string()
        .optional(),
});

module.exports = { createDatasetSchema };
