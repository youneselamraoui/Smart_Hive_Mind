const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema(
    {
        sujetId: { type: mongoose.Schema.Types.ObjectId, ref: "Sujet", required: true },
        auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        contenu: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Discussion", discussionSchema);
