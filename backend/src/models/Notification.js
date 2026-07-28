const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        destinataire: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        type: {
            type: String,
            enum: ["evenement", "bounty", "mission", "badge", "candidature", "discussion", "sujet", "formation", "mentorat", "systeme"],
            required: true,
        },
        message: { type: String, required: true },
        lien: { type: String, default: "" },
        lu: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
