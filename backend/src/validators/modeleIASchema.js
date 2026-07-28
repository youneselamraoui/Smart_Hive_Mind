const { z } = require("zod");

const publishModelSchema = z.object({
    nom: z
        .string({ required_error: "Le nom du modele est requis." })
        .min(1, "Le nom ne peut pas etre vide."),
    tache: z
        .string({ required_error: "La tache est requise." })
        .min(1, "La tache ne peut pas etre vide."),
    version: z
        .string()
        .optional(),
    explicabiliteUrl: z
        .string()
        .optional(),
    jeuDeDonneesId: z
        .string()
        .regex(/^[a-f\d]{24}$/i, "ID jeu de donnees invalide.")
        .optional(),
    performance: z
        .string()
        .optional()
        .transform((val, ctx) => {
            if (!val) return undefined;
            try {
                return JSON.parse(val);
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "performance doit etre un JSON valide.",
                });
                return z.NEVER;
            }
        }),
});

module.exports = { publishModelSchema };
