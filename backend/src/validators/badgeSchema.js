const { z } = require("zod");

const attribuerBadgeSchema = z.object({
    utilisateurId: z
        .string({ required_error: "utilisateurId est requis." })
        .regex(/^[0-9a-fA-F]{24}$/, "utilisateurId doit etre un ObjectId valide."),
    badgeType: z
        .enum(["innovateur", "collaborateur", "expert", "mentor", "contributeur", "leader"], {
            required_error: "badgeType est requis.",
        }),
    justification: z
        .string()
        .optional(),
});

module.exports = { attribuerBadgeSchema };
