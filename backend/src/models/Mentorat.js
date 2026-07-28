const mongoose = require("mongoose");

const suiviSchema = new mongoose.Schema(
    {
        date: { type: Date, default: Date.now },
        note: { type: String, trim: true },
    },
    { _id: false }
);

const mentoratSchema = new mongoose.Schema(
    {
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        apprenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        suivi: [suiviSchema],
        remunerationParHeure: { type: Number, default: 0, min: 0 },
        statut: {
            type: String,
            enum: ["actif", "termine"],
            default: "actif",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Mentorat", mentoratSchema);
