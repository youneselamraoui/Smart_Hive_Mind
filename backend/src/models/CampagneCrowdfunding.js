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
        },
        titre: { type: String, trim: true },
        description: { type: String, trim: true },
        objectifFinancier: { type: Number, required: true, min: 0 },
        contreparties: [{ type: String, trim: true }],
        dureeJours: { type: Number, required: true, min: 1 },
        fondsCollectes: { type: Number, default: 0, min: 0 },
        contributions: [contributionSchema],
        statut: { type: String, enum: ["active", "terminee", "annulee"], default: "active" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CampagneCrowdfunding", campagneCrowdfundingSchema);
