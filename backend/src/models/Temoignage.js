const mongoose = require("mongoose");

const temoignageSchema = new mongoose.Schema(
    {
        auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        titre: { type: String, required: true, trim: true },
        contenu: { type: String, required: true },
        tags: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Temoignage", temoignageSchema);
