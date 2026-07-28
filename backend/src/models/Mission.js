const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
    {
        offreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offre",
        },
        // Represente soit le travailleur assigne (flux offre->candidature),
        //  soit le createur/client (flux mission libre creerMission).
        //  A clarifier dans une future revision du modele.
        membreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        periode: {
            debut: { type: Date, required: true },
            fin: { type: Date },
        },
        livrables: [{ type: String, trim: true }],
        evaluationClient: { type: Number, min: 0, max: 5 },
        statut: {
            type: String,
            enum: ["en_cours", "terminee", "litige"],
            default: "en_cours",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Mission", missionSchema);
