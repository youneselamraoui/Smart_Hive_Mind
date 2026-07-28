const mongoose = require("mongoose");

const projetSchema = new mongoose.Schema(
    {
        ideeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Idee",
            required: true,
        },
        objectifs: [{ type: String, trim: true }],
        equipe: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membre" }],
        feuilleDeRoute: { type: String, trim: true },
        statut: {
            type: String,
            enum: ["planification", "en_cours", "termine", "abandonne"],
            default: "planification",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Projet", projetSchema);
