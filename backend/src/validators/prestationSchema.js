const { z } = require("zod");

const createPrestationSchema = z.object({
    description: z
        .string({ required_error: "La description est requise." })
        .min(1, "La description ne peut pas etre vide."),
    tarif: z
        .number({ required_error: "Le tarif est requis." })
        .positive("Le tarif doit etre un nombre positif."),
    clientId: z
        .string({ required_error: "Le client est requis." })
        .regex(/^[0-9a-fA-F]{24}$/, "clientId doit etre un ObjectId valide."),
}).strict("Champ non autorise : {path}.");

const updatePrestationSchema = z.object({
    description: z
        .string()
        .min(1, "La description ne peut pas etre vide.")
        .optional(),
    tarif: z
        .number()
        .positive("Le tarif doit etre un nombre positif.")
        .optional(),
}).strict("Champ non autorise : {path}.");

module.exports = { createPrestationSchema, updatePrestationSchema };
