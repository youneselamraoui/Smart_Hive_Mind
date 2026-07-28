const mongoose = require("mongoose");

const candidatureSchema = new mongoose.Schema(
    {
        offreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offre",
            required: true,
        },
        membreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        lettreMotivation: { type: String, trim: true },
        statut: {
            type: String,
            enum: ["en_attente", "acceptee", "refusee"],
            default: "en_attente",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Candidature", candidatureSchema);
