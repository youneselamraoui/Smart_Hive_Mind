const mongoose = require("mongoose");

const groupementSchema = new mongoose.Schema(
    {
        nom: { type: String, required: true, trim: true },
        theme: { type: String, default: "" },
        description: { type: String, default: "" },
        membres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membre" }],
        reglesAdhesion: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Groupement", groupementSchema);
