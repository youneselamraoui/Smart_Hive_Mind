const { z } = require("zod");

const evaluationSchema = z.object({
    entiteType: z.enum(["prestation", "publication"], {
        required_error: "Le type d'entite est requis.",
        invalid_type_error: "entiteType doit etre prestation ou publication.",
    }),
    entiteId: z
        .string({ required_error: "L'ID de l'entite est requis." })
        .regex(/^[a-f\d]{24}$/i, "entiteId doit etre un ObjectId valide."),
    evaluateurId: z
        .string({ required_error: "L'ID de l'evaluateur est requis." })
        .regex(/^[a-f\d]{24}$/i, "evaluateurId doit etre un ObjectId valide."),
    note: z
        .number({ required_error: "La note est requise." })
        .min(0, "La note doit etre comprise entre 0 et 10.")
        .max(10, "La note doit etre comprise entre 0 et 10."),
    commentaire: z
        .string()
        .max(2000, "Le commentaire ne peut pas depasser 2000 caracteres.")
        .optional(),
    niveau: z.enum(["pair", "expert", "ia"]).default("pair"),
});

// Evaluation d'une prestation : entiteId provient de l'URL, evaluateurId du token.
const evaluerPrestationSchema = z.object({
    note: z
        .number({ required_error: "La note est requise." })
        .min(0, "La note doit etre comprise entre 0 et 10.")
        .max(10, "La note doit etre comprise entre 0 et 10."),
    commentaire: z
        .string()
        .max(2000, "Le commentaire ne peut pas depasser 2000 caracteres.")
        .optional(),
});

module.exports = { evaluationSchema, evaluerPrestationSchema };
