const { z } = require("zod");

const createAtelierNeuroSymboliqueSchema = z.object({
    regles: z
        .array(
            z.object({
                nom: z.string().trim().optional(),
                condition: z.string().trim().optional(),
                poids: z.number().min(0).max(1).optional(),
                actif: z.boolean().optional(),
                impactSiDeclenchee: z.enum(["positif", "negatif"]).optional(),
            })
        )
        .optional(),
});

const updateReglesSchema = z.object({
    regles: z.array(
        z.object({
            nom: z.string({ required_error: "Le nom de la regle est requis." }).trim(),
            condition: z
                .string({ required_error: "La condition de la regle est requise." })
                .trim(),
            poids: z
                .number({ required_error: "Le poids est requis." })
                .min(0, "Le poids doit etre entre 0 et 1.")
                .max(1, "Le poids doit etre entre 0 et 1."),
            actif: z.boolean({ required_error: "Le champ actif est requis." }),
            impactSiDeclenchee: z.enum(["positif", "negatif"], { required_error: "L'impact si declenchee est requis." }),
        })
    ),
});

const testerReglesSchema = z.object({
    similarite: z.number().min(0).max(1),
    originalite: z.number().min(0).max(1),
    rigueur: z.number().min(0).max(1),
    completude: z.number().min(0).max(1),
});

module.exports = { createAtelierNeuroSymboliqueSchema, updateReglesSchema, testerReglesSchema };
