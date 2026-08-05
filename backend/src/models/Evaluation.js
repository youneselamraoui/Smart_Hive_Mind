const mongoose = require("mongoose");

/**
 * Evaluation independante et reutilisable (prestations, publications...).
 * Entite ciblee via entiteType + entiteId, evaluateur reference Membre.
 */
const evaluationSchema = new mongoose.Schema(
    {
        entiteType: {
            type: String,
            enum: ["prestation", "publication"],
            required: true,
        },
        entiteId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        evaluateurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        note: { type: Number, required: true, min: 0, max: 10 },
        commentaire: { type: String, trim: true, maxlength: 2000 },
        niveau: {
            type: String,
            enum: ["pair", "expert", "ia"],
            default: "pair",
        },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Une entite ne peut pas etre evaluee deux fois par le meme evaluateur.
evaluationSchema.index({ entiteType: 1, entiteId: 1, evaluateurId: 1 }, { unique: true });

module.exports = mongoose.model("Evaluation", evaluationSchema);
