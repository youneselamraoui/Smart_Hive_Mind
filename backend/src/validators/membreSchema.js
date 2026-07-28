const { z } = require("zod");

const inscriptionSchema = z.object({
    email: z
        .string({ required_error: "L'email est requis." })
        .email("L'email doit etre une adresse valide."),
    motDePasse: z
        .string({ required_error: "Le mot de passe est requis." })
        .min(8, "Le mot de passe doit contenir au moins 8 caracteres.")
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    nom: z
        .string({ required_error: "Le nom est requis." })
        .min(1, "Le nom ne peut pas etre vide."),
    prenom: z
        .string({ required_error: "Le prenom est requis." })
        .min(1, "Le prenom ne peut pas etre vide."),
    role: z.enum(["etudiant", "encadrant", "admin"], {
        required_error: "Le role est requis.",
        invalid_type_error: "Role invalide. Valeurs acceptees: etudiant, encadrant, admin.",
    }),
});

const connexionSchema = z.object({
    email: z
        .string({ required_error: "L'email est requis." })
        .email("L'email doit etre une adresse valide."),
    motDePasse: z
        .string({ required_error: "Le mot de passe est requis." })
        .min(1, "Le mot de passe ne peut pas etre vide."),
});

module.exports = { inscriptionSchema, connexionSchema };
