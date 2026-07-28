const mongoose = require("mongoose");

const jeuDeDonneesSchema = new mongoose.Schema(
    {
        nom: { type: String, required: true, trim: true },
        domaine: { type: String, default: "" },
        fichierUrl: { type: String, default: "" },
        annotations: { type: String, default: "" },
        licence: { type: String, default: "" },
        qualite: { type: Number, min: 0, max: 1, default: 0 },
        uploadePar: { type: mongoose.Schema.Types.ObjectId, ref: "Membre" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("JeuDeDonnees", jeuDeDonneesSchema);
