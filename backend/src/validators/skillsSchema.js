const { z } = require("zod");

const noterFormationSchema = z.object({
    formationId: z
        .string({ required_error: "formationId est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID formation invalide."),
    note: z
        .number({ required_error: "La note est requise." })
        .min(0, "La note doit etre entre 0 et 5.")
        .max(5, "La note doit etre entre 0 et 5."),
});

const demanderMentoratSchema = z.object({
    mentorId: z
        .string({ required_error: "mentorId est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID mentor invalide."),
});

const creerFormationSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(1, "Le titre ne peut pas etre vide."),
    format: z.enum(["video", "texte", "hybride"], {
        required_error: "Le format est requis.",
        invalid_type_error: "Format invalide. Valeurs acceptees: video, texte, hybride.",
    }),
});

module.exports = { noterFormationSchema, demanderMentoratSchema, creerFormationSchema };
