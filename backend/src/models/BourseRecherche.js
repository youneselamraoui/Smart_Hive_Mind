const mongoose = require("mongoose");

const bourseRechercheSchema = new mongoose.Schema(
    {
        financeurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        montant: { type: Number, required: true, min: 0 },
        criteres: [{ type: String, trim: true }],
        doctorantId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", default: null },
        statut: {
            type: String,
            enum: ["ouverte", "attribuee", "cloturee"],
            default: "ouverte",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("BourseRecherche", bourseRechercheSchema);
