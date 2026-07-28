const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema(
    {
        financeurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        montant: { type: Number, required: true, min: 0 },
        date: { type: Date, default: Date.now },
    },
    { _id: false }
);

const campagneCrowdfundingSchema = new mongoose.Schema(
    {
        projetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Projet",
            required: true,
        },
        objectifFinancier: { type: Number, required: true, min: 0 },
        contreparties: [{ type: String, trim: true }],
        dureeJours: { type: Number, required: true, min: 1 },
        fondsCollectes: { type: Number, default: 0, min: 0 },
        contributions: [contributionSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("CampagneCrowdfunding", campagneCrowdfundingSchema);
