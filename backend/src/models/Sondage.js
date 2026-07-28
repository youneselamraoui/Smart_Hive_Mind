const mongoose = require("mongoose");

const sondageSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    votes: { type: Map, of: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membre" }], default: {} },
    auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Membre", required: true },
    dateFin: { type: Date },
});

module.exports = mongoose.model("Sondage", sondageSchema);
