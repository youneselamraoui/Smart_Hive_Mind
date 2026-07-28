const mongoose = require("mongoose");

const thematiqueSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    forumId: { type: mongoose.Schema.Types.ObjectId, ref: "Forum", required: true },
    sujets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sujet" }],
});

module.exports = mongoose.model("Thematique", thematiqueSchema);
