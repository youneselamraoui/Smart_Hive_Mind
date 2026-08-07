const { z } = require("zod");

const createStructureRechercheSchema = z.object({
    type: z.enum(["centre", "laboratoire", "equipe"], { required_error: "Le type est requis." }),
    nom: z
        .string({ required_error: "Le nom est requis." })
        .min(2, "Le nom doit contenir au moins 2 caracteres.")
        .max(200, "Le nom ne peut pas depasser 200 caracteres."),
    membres: z
        .array(
            z.string().regex(/^[a-f\d]{24}$/i, "Le membre doit etre un ObjectId valide.")
        )
        .optional(),
    axes: z.array(z.string().trim()).optional(),
    productions: z
        .array(
            z.string().regex(/^[a-f\d]{24}$/i, "La production doit etre un ObjectId valide.")
        )
        .optional(),
});

const updateStructureRechercheSchema = z.object({
    type: z.enum(["centre", "laboratoire", "equipe"]).optional(),
    nom: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caracteres.")
        .max(200, "Le nom ne peut pas depasser 200 caracteres.")
        .optional(),
    membres: z
        .array(
            z.string().regex(/^[a-f\d]{24}$/i, "Le membre doit etre un ObjectId valide.")
        )
        .optional(),
    axes: z.array(z.string().trim()).optional(),
    productions: z
        .array(
            z.string().regex(/^[a-f\d]{24}$/i, "La production doit etre un ObjectId valide.")
        )
        .optional(),
});

module.exports = { createStructureRechercheSchema, updateStructureRechercheSchema };
