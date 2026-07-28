const { z } = require("zod");

const postulerSchema = z.object({
    offreId: z
        .string({ required_error: "L'offre est requise." })
        .regex(/^[0-9a-fA-F]{24}$/, "offreId doit etre un ObjectId valide."),
    lettreMotivation: z
        .string()
        .optional(),
});

const accepterSchema = z.object({
    candidatureId: z
        .string({ required_error: "La candidature est requise." })
        .regex(/^[0-9a-fA-F]{24}$/, "candidatureId doit etre un ObjectId valide."),
    periodeDebut: z
        .string()
        .datetime({ message: "periodeDebut doit etre une date ISO valide." })
        .optional(),
    periodeFin: z
        .string()
        .datetime({ message: "periodeFin doit etre une date ISO valide." })
        .optional(),
});

const cloturerSchema = z.object({
    missionId: z
        .string({ required_error: "La mission est requise." })
        .regex(/^[0-9a-fA-F]{24}$/, "missionId doit etre un ObjectId valide."),
    evaluationClient: z
        .number({ required_error: "evaluationClient est requis." })
        .min(0, "evaluationClient doit etre entre 0 et 5.")
        .max(5, "evaluationClient doit etre entre 0 et 5."),
    commentaire: z
        .string()
        .optional(),
    competence: z
        .string()
        .optional(),
});

const creerMissionSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(1, "Le titre ne peut pas etre vide."),
    description: z
        .string({ required_error: "La description est requise." })
        .min(1, "La description ne peut pas etre vide."),
    competencesRequises: z
        .string()
        .optional(),
    budget: z
        .number()
        .positive("Le budget doit etre un nombre positif.")
        .optional(),
    dateLimite: z
        .string()
        .datetime({ message: "dateLimite doit etre une date ISO valide." })
        .optional(),
});

module.exports = { postulerSchema, accepterSchema, cloturerSchema, creerMissionSchema };
