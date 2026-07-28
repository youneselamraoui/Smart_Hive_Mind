const mongoose = require("mongoose");

const sujetSchema = new mongoose.Schema(
    {
        titre: { type: String, required: true, trim: true },
        thematiqueId: { type: mongoose.Schema.Types.ObjectId, ref: "Thematique", required: true },
        auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        discussions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Discussion" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Sujet", sujetSchema);
