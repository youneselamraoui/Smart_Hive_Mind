const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
    noteOriginalite: { type: Number, min: 0, max: 10 },
    noteRigueur: { type: Number, min: 0, max: 10 },
    notePertinence: { type: Number, min: 0, max: 10 },
    scoreGlobal: { type: Number, min: 0, max: 1 },
    commentaire: { type: String, maxlength: 2000 },
    niveau: { type: String, enum: ["ia", "humain"], required: true },
    dateEvaluation: { type: Date, default: Date.now },
});

const preuveSchema = new mongoose.Schema({
    hash: { type: String },
    txHash: { type: String },
    blockNumber: { type: Number },
    statut: { type: String, enum: ["en_attente", "ancre", "echec"], default: "en_attente" },
});

const assistanceSegmentSchema = new mongoose.Schema({
    segment: { type: String },
    source: { type: String, enum: ["utilisateur", "ia"], required: true },
});

const publicationSchema = new mongoose.Schema(
    {
        titre: { type: String, required: true, minlength: 3, maxlength: 200 },
        contenu: { type: String, required: true },
        type: { type: String, enum: ["these", "pfe", "pfa", "libre"], required: true },
        auteur: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        statut: {
            type: String,
            enum: ["brouillon", "soumis", "en_evaluation", "accepte", "rejete"],
            default: "brouillon",
        },
        hashContenu: { type: String },
        preuve: { type: preuveSchema, default: () => ({}) },
        evaluations: [evaluationSchema],
        assistanceDetails: [assistanceSegmentSchema],
        dateSoumission: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Publication", publicationSchema);
