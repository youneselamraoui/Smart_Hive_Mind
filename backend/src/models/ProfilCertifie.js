const mongoose = require("mongoose");

const profilCertifieSchema = new mongoose.Schema(
    {
        membreId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true, unique: true },
        competencesValidees: [
            {
                competence: { type: String },
                note: { type: Number },
                missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission" },
                validePar: { type: mongoose.Schema.Types.ObjectId, ref: "Membre" },
                date: { type: Date },
            },
        ],
        formationsSuivies: [
            {
                formationId: { type: mongoose.Schema.Types.ObjectId, ref: "Formation" },
                dateCompletion: { type: Date },
            },
        ],
        historiqueMissions: [
            {
                missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission" },
                evaluationClient: { type: Number },
            },
        ],
        oeuvresProuvees: [
            {
                publicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Publication" },
            },
        ],
        reputationScore: { type: Number, default: 0, min: 0, max: 100 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ProfilCertifie", profilCertifieSchema);
