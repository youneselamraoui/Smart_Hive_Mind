const mongoose = require("mongoose");

const prestationSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true },
        tarif: { type: Number, required: true, min: 0 },
        prestataireId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        statut: {
            type: String,
            enum: ["proposee", "negociee", "en_cours", "terminee"],
            default: "proposee",
        },
        evaluationFinale: { type: mongoose.Schema.Types.ObjectId, ref: "Evaluation" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Prestation", prestationSchema);
