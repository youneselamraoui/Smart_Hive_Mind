const mongoose = require("mongoose");

const outilSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    categorie: { type: String, enum: ["ai", "devsecops", "it"], required: true },
    fonction: { type: String, default: "" },
    coutUsage: { type: Number, default: 0 },
});

module.exports = mongoose.model("Outil", outilSchema);
