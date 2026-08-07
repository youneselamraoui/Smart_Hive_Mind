const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
    {
        nom: { type: String, required: true, trim: true },
        domaines: [{ type: String, trim: true }],
        description: { type: String, trim: true },
        comite: [
            {
                membreId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
                role: { type: String, required: true },
            },
        ],
        administrateurs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membre" }],
        statut: { type: String, enum: ["actif", "inactif"], default: "actif" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Journal", journalSchema);
