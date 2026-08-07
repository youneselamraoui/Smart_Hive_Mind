const mongoose = require("mongoose");

const preuveSchema = new mongoose.Schema({
    hash: { type: String },
    txHash: { type: String },
    blockNumber: { type: Number },
    statut: { type: String, enum: ["en_attente", "ancre", "echec"], default: "en_attente" },
    // "livrable" reserve pour usage futur quand un modele Livrable dedie existera
    typeEntite: { type: String, enum: ["publication", "contribution", "idee"] },
});

module.exports = preuveSchema;
