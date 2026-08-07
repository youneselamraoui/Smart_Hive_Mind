const { z } = require("zod");

const createJournalSchema = z.object({
    nom: z
        .string({ required_error: "Le nom est requis." })
        .min(2, "Le nom doit contenir au moins 2 caracteres.")
        .max(200, "Le nom ne peut pas depasser 200 caracteres."),
    domaines: z.array(z.string().trim()).optional(),
    description: z.string().trim().optional(),
    comite: z
        .array(
            z.object({
                membreId: z
                    .string()
                    .regex(/^[a-f\d]{24}$/i, "Le membreId doit etre un ObjectId valide."),
                role: z.string({ required_error: "Le role du membre est requis." }),
            })
        )
        .optional(),
    administrateurs: z
        .array(
            z.string().regex(/^[a-f\d]{24}$/i, "L'administrateur doit etre un ObjectId valide.")
        )
        .optional(),
    statut: z.enum(["actif", "inactif"]).optional(),
});

const updateJournalSchema = z.object({
    nom: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caracteres.")
        .max(200, "Le nom ne peut pas depasser 200 caracteres.")
        .optional(),
    domaines: z.array(z.string().trim()).optional(),
    description: z.string().trim().optional(),
    comite: z
        .array(
            z.object({
                membreId: z
                    .string()
                    .regex(/^[a-f\d]{24}$/i, "Le membreId doit etre un ObjectId valide."),
                role: z.string({ required_error: "Le role du membre est requis." }),
            })
        )
        .optional(),
    administrateurs: z
        .array(
            z.string().regex(/^[a-f\d]{24}$/i, "L'administrateur doit etre un ObjectId valide.")
        )
        .optional(),
    statut: z.enum(["actif", "inactif"]).optional(),
});

const soumettreJournalSchema = z.object({
    journalId: z
        .string({ required_error: "journalId est requis." })
        .regex(/^[a-f\d]{24}$/i, "Le journalId doit etre un ObjectId valide."),
});

module.exports = { createJournalSchema, updateJournalSchema, soumettreJournalSchema };
