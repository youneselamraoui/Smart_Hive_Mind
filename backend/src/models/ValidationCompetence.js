const mongoose = require("mongoose");

const validationCompetenceSchema = new mongoose.Schema(
    {
        membreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        missionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mission",
            required: true,
        },
        competence: { type: String, required: true, trim: true },
        note: { type: Number, required: true, min: 0, max: 5 },
        validePar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ValidationCompetence", validationCompetenceSchema);
