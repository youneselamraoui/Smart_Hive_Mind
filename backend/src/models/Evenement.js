const mongoose = require("mongoose");

const evenementSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["hackathon", "congres", "salon", "concours"],
            required: true,
        },
        titre: { type: String, required: true, trim: true },
        dates: {
            debut: { type: Date, required: true },
            fin: { type: Date, required: true },
        },
        programme: [{
            intitule: { type: String, required: true, trim: true },
            heure: { type: String, required: true, trim: true },
            description: { type: String, trim: true },
        }],
        organisateurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        inscrits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membre" }],
        capaciteMax: { type: Number, min: 0 },
        espacePrive: { type: Boolean, default: false },
        oeuvresSoumises: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Publication" },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Evenement", evenementSchema);
