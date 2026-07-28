const { z } = require("zod");

const accepterMentoratSchema = z.object({
    mentoratId: z
        .string({ required_error: "L'ID du mentorat est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID mentorat invalide."),
    remunerationParHeure: z
        .number({ invalid_type_error: "remunerationParHeure doit etre un nombre." })
        .nonnegative("Le taux horaire ne peut pas etre negatif.")
        .optional(),
});

const ajouterSuiviMentoratSchema = z.object({
    mentoratId: z
        .string({ required_error: "L'ID du mentorat est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID mentorat invalide."),
    note: z
        .string({ required_error: "La note de suivi est requise." })
        .min(1, "La note ne peut pas etre vide."),
});

module.exports = { accepterMentoratSchema, ajouterSuiviMentoratSchema };
