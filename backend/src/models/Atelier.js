const mongoose = require("mongoose");

const etapeSchema = new mongoose.Schema({
    outilId: { type: mongoose.Schema.Types.ObjectId, ref: "Outil" },
    statut: { type: String, enum: ["en_attente", "en_cours", "termine", "echec"], default: "en_attente" },
    resultatUrl: { type: String, default: "" },
});

const atelierSchema = new mongoose.Schema(
    {
        nom: { type: String, required: true, trim: true },
        etapes: [etapeSchema],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        statutGlobal: {
            type: String,
            enum: ["en_cours", "termine", "echec"],
            default: "en_cours",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Atelier", atelierSchema);
