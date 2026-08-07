const { z } = require("zod");

const createProjetRechercheFinanceSchema = z.object({
    theme: z
        .string({ required_error: "Le theme est requis." })
        .min(2, "Le theme doit contenir au moins 2 caracteres.")
        .max(500, "Le theme ne peut pas depasser 500 caracteres."),
    budget: z.number().optional(),
    livrables: z
        .array(
            z.object({
                description: z.string().trim().optional(),
                dateEcheance: z.string().optional(),
                statut: z.string().trim().optional(),
            })
        )
        .optional(),
    structureRechercheId: z
        .string()
        .regex(/^[a-f\d]{24}$/i, "La structureRechercheId doit etre un ObjectId valide.")
        .optional(),
});

const updateProjetRechercheFinanceSchema = z.object({
    theme: z
        .string()
        .min(2, "Le theme doit contenir au moins 2 caracteres.")
        .max(500, "Le theme ne peut pas depasser 500 caracteres.")
        .optional(),
    budget: z.number().optional(),
    livrables: z
        .array(
            z.object({
                description: z.string().trim().optional(),
                dateEcheance: z.string().optional(),
                statut: z.string().trim().optional(),
            })
        )
        .optional(),
    industrielId: z
        .string()
        .regex(/^[a-f\d]{24}$/i, "L'industrielId doit etre un ObjectId valide.")
        .optional(),
    structureRechercheId: z
        .string()
        .regex(/^[a-f\d]{24}$/i, "La structureRechercheId doit etre un ObjectId valide.")
        .optional(),
    statut: z.enum(["candidature", "en_cours", "termine"]).optional(),
    candidatures: z
        .array(
            z.object({
                equipeId: z
                    .string()
                    .regex(/^[a-f\d]{24}$/i, "L'equipeId doit etre un ObjectId valide."),
                dateCandidature: z.string().optional(),
                statut: z.string().trim().optional(),
            })
        )
        .optional(),
});

const candidaterProjetSchema = z.object({
    equipeId: z
        .string({ required_error: "equipeId est requis." })
        .regex(/^[a-f\d]{24}$/i, "L'equipeId doit etre un ObjectId valide."),
});

const attribuerProjetSchema = z.object({
    equipeId: z
        .string({ required_error: "equipeId est requis." })
        .regex(/^[a-f\d]{24}$/i, "L'equipeId doit etre un ObjectId valide."),
});

module.exports = {
    createProjetRechercheFinanceSchema,
    updateProjetRechercheFinanceSchema,
    candidaterProjetSchema,
    attribuerProjetSchema,
};
