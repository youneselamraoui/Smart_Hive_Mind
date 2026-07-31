const mongoose = require("mongoose");

const etapeSchema = new mongoose.Schema({
    outilId: { type: mongoose.Schema.Types.ObjectId, ref: "Outil" },
    statut: { type: String, enum: ["en_attente", "en_cours", "termine", "echec"], default: "en_attente" },
    resultatUrl: { type: String, default: "" },
    label: { type: String, trim: true },
    resultat: { type: mongoose.Schema.Types.Mixed },
});

const atelierSchema = new mongoose.Schema(
    {
        nom: { type: String, required: true, trim: true },
        type: { type: String, enum: ["neuro_symbolique"] },
        regles: [
            {
                nom: { type: String, trim: true },
                condition: { type: String, trim: true },
                poids: { type: Number, min: 0, max: 1 },
                actif: { type: Boolean, default: true },
                impactSiDeclenchee: { type: String, enum: ["positif", "negatif"], default: "positif" },
            },
        ],
        etapes: [etapeSchema],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        statutGlobal: {
            type: String,
            enum: ["en_cours", "termine", "echec"],
            default: "en_cours",
        },
        resultatFinal: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Atelier", atelierSchema);
