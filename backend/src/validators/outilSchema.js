const { z } = require("zod");

const CATEGORIES_OUTILS = ["ai", "devsecops", "it"];

const baseOutilSchema = z.object({
    nom: z
        .string({ required_error: "Le nom de l'outil est requis." })
        .min(1, "Le nom ne peut pas etre vide."),
    categorie: z
        .enum(CATEGORIES_OUTILS, { required_error: "La categorie est requise." }),
    fonction: z
        .string()
        .optional(),
    coutUsage: z
        .number({ invalid_type_error: "coutUsage doit etre un nombre." })
        .min(0, "Le cout d'usage ne peut pas etre negatif.")
        .optional(),
});

const creerOutilSchema = baseOutilSchema;

const majOutilSchema = baseOutilSchema.partial();

const listOutilsSchema = z.object({
    categorie: z
        .enum(CATEGORIES_OUTILS, { message: "Categorie invalide." })
        .optional(),
    fonction: z
        .string()
        .optional(),
});

module.exports = { creerOutilSchema, majOutilSchema, listOutilsSchema };
