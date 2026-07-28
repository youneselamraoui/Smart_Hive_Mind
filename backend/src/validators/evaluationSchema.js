const { z } = require("zod");

const evaluationSchema = z.object({
    publicationId: z
        .string({ required_error: "L'ID de la publication est requis." })
        .regex(/^[a-f\d]{24}$/i, "L'ID publication doit etre un ObjectId valide."),
    evaluateurId: z
        .string({ required_error: "L'ID de l'evaluateur est requis." })
        .regex(/^[a-f\d]{24}$/i, "L'ID evaluateur doit etre un ObjectId valide."),
    noteOriginalite: z
        .number({ required_error: "La note d'originalite est requise." })
        .min(0, "La note doit etre comprise entre 0 et 10.")
        .max(10, "La note doit etre comprise entre 0 et 10."),
    noteRigueur: z
        .number({ required_error: "La note de rigueur est requise." })
        .min(0, "La note doit etre comprise entre 0 et 10.")
        .max(10, "La note doit etre comprise entre 0 et 10."),
    notePertinence: z
        .number({ required_error: "La note de pertinence est requise." })
        .min(0, "La note doit etre comprise entre 0 et 10.")
        .max(10, "La note doit etre comprise entre 0 et 10."),
    commentaire: z
        .string()
        .max(2000, "Le commentaire ne peut pas depasser 2000 caracteres.")
        .optional(),
});

module.exports = evaluationSchema;
