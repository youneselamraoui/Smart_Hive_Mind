const mongoose = require("mongoose");

const projetRechercheFinanceSchema = new mongoose.Schema(
    {
        theme: { type: String, required: true, trim: true },
        budget: { type: Number },
        livrables: [
            {
                description: { type: String, trim: true },
                dateEcheance: { type: Date },
                statut: { type: String },
            },
        ],
        industrielId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre" },
        structureRechercheId: { type: mongoose.Schema.Types.ObjectId, ref: "StructureRecherche" },
        statut: { type: String, enum: ["candidature", "en_cours", "termine"], default: "candidature" },
        candidatures: [
            {
                equipeId: { type: mongoose.Schema.Types.ObjectId, ref: "StructureRecherche" },
                dateCandidature: { type: Date },
                statut: { type: String },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("ProjetRechercheFinance", projetRechercheFinanceSchema);
