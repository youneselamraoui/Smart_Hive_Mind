const mongoose = require("mongoose");

const structureRechercheSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["centre", "laboratoire", "equipe"], required: true },
        nom: { type: String, required: true, trim: true },
        membres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membre" }],
        axes: [{ type: String, trim: true }],
        productions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Publication" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("StructureRecherche", structureRechercheSchema);
