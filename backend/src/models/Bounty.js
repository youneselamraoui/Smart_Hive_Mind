const mongoose = require("mongoose");

const soumissionSchema = new mongoose.Schema(
    {
        membreId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        contenuUrl: { type: String, required: true, trim: true },
        dateSubmission: { type: Date, default: Date.now },
    },
    { _id: false }
);

const bountySchema = new mongoose.Schema(
    {
        titre: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        recompense: { type: Number, required: true, min: 0 },
        delai: { type: Date, required: true },
        publiePar: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
        soumissions: [soumissionSchema],
        gagnantId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Bounty", bountySchema);
