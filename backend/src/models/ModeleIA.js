const mongoose = require("mongoose");

const modeleIASchema = new mongoose.Schema(
    {
        nom: { type: String, required: true, trim: true },
        tache: { type: String, default: "" },
        performance: { type: mongoose.Schema.Types.Mixed, default: {} },
        version: { type: String, default: "1.0.0" },
        explicabiliteUrl: { type: String, default: "" },
        auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre" },
        jeuDeDonneesId: { type: mongoose.Schema.Types.ObjectId, ref: "JeuDeDonnees" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ModeleIA", modeleIASchema);
