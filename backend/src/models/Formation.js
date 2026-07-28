const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        membreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        note: { type: Number, required: true, min: 0, max: 5 },
    },
    { _id: false }
);

const formationSchema = new mongoose.Schema(
    {
        titre: { type: String, required: true, trim: true },
        format: {
            type: String,
            enum: ["video", "texte", "hybride"],
            required: true,
        },
        contenuUrl: { type: String, default: "" },
        auteurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        notes: [noteSchema],
        certificationCommunautaire: { type: Number, default: 0, min: 0, max: 5 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Formation", formationSchema);
