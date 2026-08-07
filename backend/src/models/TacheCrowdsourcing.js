const mongoose = require("mongoose");
const preuveSchema = require("./schemas/preuveSchema");

const lotSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true },
        assigneA: { type: mongoose.Schema.Types.ObjectId, ref: "Membre" },
        statut: {
            type: String,
            enum: ["ouverte", "assigne", "en_cours", "terminee"],
            default: "ouverte",
        },
        remunerationCalculee: { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const tacheCrowdsourcingSchema = new mongoose.Schema(
    {
        titre: { type: String, required: true, trim: true },
        lots: [lotSchema],
        remunerationTotale: { type: Number, default: 0, min: 0 },
        preuve: { type: preuveSchema, default: () => ({}) },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TacheCrowdsourcing", tacheCrowdsourcingSchema);
