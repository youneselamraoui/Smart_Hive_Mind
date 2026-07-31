const mongoose = require("mongoose");
const preuveSchema = require("./schemas/preuveSchema");

const commentaireSchema = new mongoose.Schema(
    {
        auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        texte: { type: String, required: true, trim: true },
        date: { type: Date, default: Date.now },
    },
    { _id: false }
);

const ideeSchema = new mongoose.Schema(
    {
        titre: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membre" }],
        commentaires: [commentaireSchema],
        statut: {
            type: String,
            enum: ["proposee", "en_projet"],
            default: "proposee",
        },
        preuve: { type: preuveSchema, default: () => ({}) },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Idee", ideeSchema);
