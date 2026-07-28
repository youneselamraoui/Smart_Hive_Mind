const { z } = require("zod");

const demanderResetSchema = z.object({
    email: z
        .string({ required_error: "L'email est requis." })
        .email("L'email doit etre une adresse valide."),
});

const verifierCodeSchema = z.object({
    email: z
        .string({ required_error: "L'email est requis." })
        .email("L'email doit etre une adresse valide."),
    code: z
        .string({ required_error: "Le code est requis." })
        .length(6, "Le code doit contenir exactement 6 caracteres.")
        .regex(/^\d+$/, "Le code doit contenir uniquement des chiffres."),
});

const reinitialiserMotDePasseSchema = z.object({
    email: z
        .string({ required_error: "L'email est requis." })
        .email("L'email doit etre une adresse valide."),
    code: z
        .string({ required_error: "Le code est requis." })
        .length(6, "Le code doit contenir exactement 6 caracteres.")
        .regex(/^\d+$/, "Le code doit contenir uniquement des chiffres."),
    motDePasse: z
        .string({ required_error: "Le mot de passe est requis." })
        .min(8, "Le mot de passe doit contenir au moins 8 caracteres.")
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
});

const updateProfilSchema = z.object({
    nom: z.string().min(1, "Le nom ne peut pas etre vide.").optional(),
    prenom: z.string().min(1, "Le prenom ne peut pas etre vide.").optional(),
    email: z.string().email("L'email doit etre une adresse valide.").optional(),
    motDePasse: z
        .string()
        .min(8, "Le mot de passe doit contenir au moins 8 caracteres.")
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.")
        .optional(),
});

module.exports = { demanderResetSchema, verifierCodeSchema, reinitialiserMotDePasseSchema, updateProfilSchema };
