const { z } = require("zod");

const createAtelierSchema = z.object({
    nom: z
        .string()
        .min(1, "Le nom ne peut pas etre vide.")
        .optional(),
    type: z
        .string({ required_error: "Le type d'atelier est requis." })
        .min(1, "Le type ne peut pas etre vide."),
});

module.exports = { createAtelierSchema };
