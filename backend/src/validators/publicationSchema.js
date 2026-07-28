const { z } = require("zod");

const publicationSchema = z.object({
    titre: z
        .string({ required_error: "Le titre est requis." })
        .min(3, "Le titre doit contenir au moins 3 caracteres.")
        .max(200, "Le titre ne peut pas depasser 200 caracteres."),
    contenu: z
        .string({ required_error: "Le contenu est requis." })
        .min(1, "Le contenu ne peut pas etre vide."),
    type: z.enum(["these", "pfe", "pfa", "libre"], {
        required_error: "Le type de publication est requis.",
        invalid_type_error: "Type invalide. Valeurs acceptees: these, pfe, pfa, libre.",
    }),
    auteur: z
        .string({ required_error: "L'auteur est requis." })
        .regex(/^[a-f\d]{24}$/i, "L'ID auteur doit etre un ObjectId valide."),
});

module.exports = publicationSchema;
