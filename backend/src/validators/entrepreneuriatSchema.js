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
        .string({ required_error: "Le projet est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID projet invalide."),
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

module.exports = {
    createIdeeSchema,
    promoteToProjetSchema,
    generateBusinessPlanSchema,
    contributeSchema,
    voteIdeeSchema,
};
