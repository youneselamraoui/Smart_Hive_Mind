const { z } = require("zod");

const createSujetSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    thematiqueId: z
        .string({ required_error: "La thematique est requise." })
        .regex(/^[a-f\d]{24}$/i, "ID thematique invalide."),
    contenu: z
        .string({ required_error: "Le contenu du premier message est requis." }),
});

const addDiscussionSchema = z.object({
    sujetId: z
        .string({ required_error: "Le sujet est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID sujet invalide."),
    contenu: z
        .string({ required_error: "Le contenu de la discussion est requis." }),
});

const listSujetsSchema = z.object({
    thematiqueId: z
        .string()
        .regex(/^[a-f\d]{24}$/i, "ID thematique invalide.")
        .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createSondageSchema = z.object({
    question: z
        .string({ required_error: "La question est requise." })
        .min(3, "La question doit contenir au moins 3 caracteres."),
    options: z
        .array(z.string().min(1, "Une option ne peut pas etre vide."))
        .min(2, "Au moins 2 options sont requises.")
        .max(20, "Maximum 20 options autorisees."),
    dateFin: z.string().datetime().optional(),
});

const votePollSchema = z.object({
    sondageId: z
        .string({ required_error: "Le sondage est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID sondage invalide."),
    optionIndex: z
        .number({ required_error: "L index de l option est requis." })
        .int()
        .min(0, "Index d option invalide."),
});

const createTemoignageSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    contenu: z
        .string({ required_error: "Le contenu est requis." }),
    tags: z.array(z.string().trim()).optional().default([]),
});

const listTemoignagesSchema = z.object({
    tags: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createGroupementSchema = z.object({
    nom: z
        .string({ required_error: "Le nom est requis." })
        .min(3, "Le nom doit contenir au moins 3 caracteres.")
        .max(100, "Le nom ne peut pas depasser 100 caracteres."),
    theme: z.string().optional().default(""),
    description: z.string().optional().default(""),
    reglesAdhesion: z.string().optional().default(""),
});

const joinGroupementSchema = z.object({
    groupementId: z
        .string({ required_error: "Le groupement est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID groupement invalide."),
});

module.exports = {
    createSujetSchema,
    addDiscussionSchema,
    listSujetsSchema,
    createSondageSchema,
    votePollSchema,
    createTemoignageSchema,
    listTemoignagesSchema,
    createGroupementSchema,
    joinGroupementSchema,
};
