const { z } = require("zod");

const createTacheCrowdsourcingSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    lots: z.array(
        z.object({
            description: z
                .string({ required_error: "La description du lot est requise." })
                .trim()
                .min(1, "La description du lot ne peut pas etre vide."),
        })
    ).optional(),
    remunerationTotale: z.number().min(0).optional(),
});

module.exports = { createTacheCrowdsourcingSchema };
