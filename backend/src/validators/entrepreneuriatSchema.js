const { z } = require("zod");

const createIdeeSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    description: z
        .string({ required_error: "La description est requise." })
        .min(10, "La description doit contenir au moins 10 caracteres."),
});

const promoteToProjetSchema = z.object({
    ideeId: z
        .string({ required_error: "L'idee est requise." })
        .regex(/^[a-f\d]{24}$/i, "ID idee invalide."),
});

const generateBusinessPlanSchema = z.object({
    projetId: z
        .string()
        .regex(/^[a-f\d]{24}$/i, "ID projet invalide.")
        .nullable()
        .optional(),
    contenu: z
        .string({ required_error: "Le contenu du business plan est requis." })
        .min(1, "Le contenu ne peut pas etre vide."),
});

const contributeSchema = z.object({
    campagneId: z
        .string({ required_error: "La campagne est requise." })
        .regex(/^[a-f\d]{24}$/i, "ID campagne invalide."),
    montant: z
        .number({ required_error: "Le montant est requis." })
        .positive("Le montant doit etre positif."),
});

const voteIdeeSchema = z.object({
    ideeId: z
        .string({ required_error: "L'idee est requise." })
        .regex(/^[a-f\d]{24}$/i, "ID idee invalide."),
});

const createCampagneSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(2, "Le titre doit contenir au moins 2 caracteres."),
    description: z
        .string({ required_error: "La description est requise." })
        .min(10, "La description doit contenir au moins 10 caracteres."),
    objectif: z
        .number({ required_error: "L'objectif financier est requis." })
        .positive("L'objectif doit etre positif."),
    dateFin: z
        .string({ required_error: "La date de fin est requise." })
        .refine((v) => !isNaN(Date.parse(v)), "Date de fin invalide."),
});

module.exports = {
    createIdeeSchema,
    promoteToProjetSchema,
    generateBusinessPlanSchema,
    contributeSchema,
    voteIdeeSchema,
    createCampagneSchema,
};
