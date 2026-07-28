const mongoose = require("mongoose");

const offreSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["emploi", "stage"], required: true },
        titre: { type: String, required: true, trim: true },
        exigences: [{ type: String, trim: true }],
        organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        statut: {
            type: String,
            enum: ["ouverte", "fermee", "pourvue"],
            default: "ouverte",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Offre", offreSchema);
