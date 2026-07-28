const mongoose = require("mongoose");

const membreSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        motDePasse: { type: String, required: true },
        nom: { type: String, required: true, trim: true },
        prenom: { type: String, required: true, trim: true },
        role: { type: String, enum: ["etudiant", "encadrant", "admin", "organisation"], required: true },
        reputationScore: { type: Number, default: 0, min: 0, max: 100 },
        resetCode: { type: String },
        resetCodeExpires: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Membre", membreSchema);
