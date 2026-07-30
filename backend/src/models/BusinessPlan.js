const mongoose = require("mongoose");

const assistanceSegmentSchema = new mongoose.Schema(
    {
        segment: { type: String },
        source: { type: String, enum: ["utilisateur", "ia"], required: true },
    },
    { _id: false }
);

const businessPlanSchema = new mongoose.Schema(
    {
        titre: { type: String, trim: true },
        projetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Projet",
        },
        modeleEconomique: { type: String, trim: true },
        budget: { type: Number, min: 0 },
        previsions: { type: String, trim: true },
        version: { type: String, default: "1.0.0" },
        assistanceDetails: [assistanceSegmentSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("BusinessPlan", businessPlanSchema);
