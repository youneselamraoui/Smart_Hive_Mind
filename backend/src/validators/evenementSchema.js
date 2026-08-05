const { z } = require("zod");

const inscrireMembreSchema = z.object({
    evenementId: z
        .string({ required_error: "L'ID de l'evenement est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID evenement invalide."),
});

const createEvenementSchema = z.object({
    type: z.enum(["hackathon", "congres", "salon", "concours"], {
        required_error: "Le type est requis.",
        invalid_type_error: "Le type doit etre hackathon, congres, salon ou concours.",
    }),
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    dates: z.object(
        {
            debut: z
                .string({ required_error: "La date de debut est requise." })
                .datetime({ message: "La date de debut doit etre une date ISO valide." }),
            fin: z
                .string({ required_error: "La date de fin est requise." })
                .datetime({ message: "La date de fin doit etre une date ISO valide." }),
        },
        { required_error: "Les dates sont requises." }
    ),
    programme: z
        .array(
            z.object({
                intitule: z
                    .string({ required_error: "L'intitule est requis." })
                    .min(1, "L'intitule ne peut pas etre vide."),
                heure: z
                    .string({ required_error: "L'heure est requise." })
                    .min(1, "L'heure ne peut pas etre vide."),
                description: z.string().optional(),
            })
        )
        .optional(),
    capaciteMax: z
        .number({ invalid_type_error: "capaciteMax doit etre un nombre." })
        .int("capaciteMax doit etre un entier.")
        .min(0, "capaciteMax ne peut pas etre negatif.")
        .optional(),
    espacePrive: z.boolean().optional(),
});

const soumettreOeuvreSchema = z.object({
    evenementId: z
        .string({ required_error: "L'ID de l'evenement est requis." })
        .regex(/^[a-f\d]{24}$/i, "ID evenement invalide."),
    titre: z
        .string({ required_error: "Le titre de l'oeuvre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    contenu: z
        .string({ required_error: "Le contenu de l'oeuvre est requis." })
        .min(1, "Le contenu ne peut pas etre vide."),
});

const ajouterProgrammeSchema = z.object({
    intitule: z
        .string({ required_error: "L'intitule est requis." })
        .min(1, "L'intitule ne peut pas etre vide."),
    heure: z
        .string({ required_error: "L'heure est requise." })
        .min(1, "L'heure ne peut pas etre vide."),
    description: z.string().optional(),
});

module.exports = { inscrireMembreSchema, createEvenementSchema, soumettreOeuvreSchema, ajouterProgrammeSchema };
